'use strict'

/**
 * Human-in-the-Loop (HITL) Verification API
 *
 * Flow:
 *   1. After OCR completes (document status = READY), call POST /api/hitl/submit/:docId
 *      → AI validates extracted fields → flags exceptions → creates a HITLReview record
 *   2. CMPDI/Reviewer calls GET /api/hitl/pending   → see all pending reviews
 *   3. Reviewer calls PATCH /api/hitl/:id/approve   → marks field as verified
 *   4. Reviewer calls PATCH /api/hitl/:id/reject    → flags for re-extraction
 *   5. Once all critical fields approved → document is HITL_VERIFIED
 *   6. Report generator can only use HITL_VERIFIED documents for traceable reports
 */

const express = require('express')
const { prisma }      = require('../utils/prisma')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)

// ── AI Field Validator ────────────────────────────────────────────────
function validateExtractedFields(fields) {
  const exceptions = []
  const verified   = []

  for (const [key, value] of Object.entries(fields)) {
    if (value == null || value === '' || value === 'null') {
      exceptions.push({
        fieldName:   key,
        fieldValue:  String(value),
        issue:       'Empty or null value — requires manual entry',
        severity:    'high',
        requiresHuman: true,
      })
      continue
    }

    const str = String(value)

    // Numeric sanity checks
    if (key === 'productionMT') {
      const n = parseFloat(str)
      if (isNaN(n)) {
        exceptions.push({ fieldName:key, fieldValue:str, issue:'Not a valid number', severity:'high', requiresHuman:true })
      } else if (n <= 0) {
        exceptions.push({ fieldName:key, fieldValue:str, issue:'Production value must be positive', severity:'high', requiresHuman:true })
      } else if (n > 500) {
        exceptions.push({ fieldName:key, fieldValue:str, issue:'Unusually large value (>500 MT) — please verify', severity:'medium', requiresHuman:true })
      } else {
        verified.push({ fieldName:key, fieldValue:str, confidence:0.95 })
      }
      continue
    }

    if (key === 'gcvKcal') {
      const n = parseFloat(str)
      if (isNaN(n) || n < 500 || n > 9000) {
        exceptions.push({ fieldName:key, fieldValue:str, issue:`GCV ${n} kcal/kg out of expected range (500–9000)`, severity:'medium', requiresHuman:true })
      } else { verified.push({ fieldName:key, fieldValue:str, confidence:0.92 }) }
      continue
    }

    if (key === 'ashPct') {
      const n = parseFloat(str)
      if (isNaN(n) || n < 0 || n > 100) {
        exceptions.push({ fieldName:key, fieldValue:str, issue:`Ash % ${n} out of range (0–100)`, severity:'high', requiresHuman:true })
      } else { verified.push({ fieldName:key, fieldValue:str, confidence:0.93 }) }
      continue
    }

    if (key === 'pH') {
      const n = parseFloat(str)
      if (isNaN(n) || n < 0 || n > 14) {
        exceptions.push({ fieldName:key, fieldValue:str, issue:`pH ${n} out of range (0–14)`, severity:'high', requiresHuman:true })
      } else { verified.push({ fieldName:key, fieldValue:str, confidence:0.97 }) }
      continue
    }

    if (key === 'spmUgM3') {
      const n = parseFloat(str)
      if (!isNaN(n) && n > 600) {
        exceptions.push({ fieldName:key, fieldValue:str, issue:`SPM ${n} µg/m³ exceeds standard (600) — flag for compliance`, severity:'medium', requiresHuman:true })
      } else { verified.push({ fieldName:key, fieldValue:str, confidence:0.90 }) }
      continue
    }

    if (key === 'depthM') {
      const n = parseFloat(str)
      if (!isNaN(n) && n > 1000) {
        exceptions.push({ fieldName:key, fieldValue:str, issue:`Depth ${n}m seems unusually large — verify source`, severity:'low', requiresHuman:true })
      } else { verified.push({ fieldName:key, fieldValue:str, confidence:0.88 }) }
      continue
    }

    if (key === 'totalReserveMT' || key === 'mineableReserveMT') {
      const n = parseFloat(str)
      if (isNaN(n)) {
        exceptions.push({ fieldName:key, fieldValue:str, issue:'Reserve value is not numeric — check source document', severity:'high', requiresHuman:true })
      } else if (n < 0) {
        exceptions.push({ fieldName:key, fieldValue:str, issue:'Reserve cannot be negative', severity:'critical', requiresHuman:true })
      } else { verified.push({ fieldName:key, fieldValue:str, confidence:0.89 }) }
      continue
    }

    // Grade format check
    if (key === 'grade') {
      if (!/^G\d{1,2}$/i.test(str)) {
        exceptions.push({ fieldName:key, fieldValue:str, issue:`Grade "${str}" does not match expected format (G1–G17)`, severity:'medium', requiresHuman:true })
      } else { verified.push({ fieldName:key, fieldValue:str, confidence:0.96 }) }
      continue
    }

    // Date check
    if (key.toLowerCase().includes('date') || key === 'year') {
      if (str.length < 4) {
        exceptions.push({ fieldName:key, fieldValue:str, issue:'Date/year value too short', severity:'low', requiresHuman:true })
      } else { verified.push({ fieldName:key, fieldValue:str, confidence:0.91 }) }
      continue
    }

    // Default: pass with moderate confidence
    verified.push({ fieldName:key, fieldValue:str, confidence:0.80 })
  }

  const score = verified.length > 0
    ? Math.round((verified.length / (verified.length + exceptions.length)) * 100)
    : 0

  const status = exceptions.some(e => e.severity === 'critical') ? 'CRITICAL_EXCEPTION'
    : exceptions.some(e => e.severity === 'high')     ? 'HAS_EXCEPTIONS'
    : exceptions.length > 0                           ? 'MINOR_EXCEPTIONS'
    : 'AUTO_VERIFIED'

  return { verified, exceptions, score, status }
}

// ── POST /api/hitl/submit/:docId — run HITL on a processed document ──
router.post('/submit/:docId', async (req, res, next) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.docId } })
    if (!doc) return res.status(404).json({ error: 'Document not found.' })
    if (doc.status !== 'READY') return res.status(400).json({ error: `Document status is ${doc.status}. Must be READY.` })

    // Get extracted fields from knowledge base
    const entries = await prisma.knowledgeEntry.findMany({ where: { documentId: doc.id } })
    if (entries.length === 0) {
      return res.status(400).json({ error: 'No extracted fields found for this document. Ensure OCR pipeline completed.' })
    }

    // Build fields object
    const fields = {}
    for (const e of entries) fields[e.fieldName] = e.fieldValue

    // Run AI validation
    const { verified, exceptions, score, status } = validateExtractedFields(fields)

    // Store review record in document metadata
    const existingMeta = doc.metadata
      ? (() => { try { return typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata } catch { return {} } })()
      : {}

    await prisma.document.update({
      where: { id: doc.id },
      data: {
        metadata: JSON.stringify({
          ...existingMeta,
          hitl: {
            submittedAt:  new Date().toISOString(),
            submittedBy:  req.user.id,
            verified,
            exceptions,
            score,
            status,
            fieldStatuses: {}, // will track per-field human decisions
          },
        }),
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId:   req.user.id,
        action:   'HITL_SUBMIT',
        entity:   'Document',
        entityId: doc.id,
        details:  JSON.stringify({ score, status, exceptionCount: exceptions.length }),
      },
    }).catch(() => {})

    res.json({
      documentId: doc.id,
      verified,
      exceptions,
      score,
      status,
      message: status === 'AUTO_VERIFIED'
        ? 'All fields auto-verified. Document ready for report generation.'
        : `${exceptions.length} exception(s) require human review before report generation.`,
    })
  } catch (err) { next(err) }
})

// ── GET /api/hitl/:docId — get HITL review status ─────────────────────
router.get('/:docId', async (req, res, next) => {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.docId },
      select: { id:true, originalName:true, status:true, department:true, metadata:true, updatedAt:true },
    })
    if (!doc) return res.status(404).json({ error: 'Document not found.' })

    const meta = doc.metadata
      ? (() => { try { return typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata } catch { return {} } })()
      : {}

    res.json({ document: doc, hitl: meta.hitl || null })
  } catch (err) { next(err) }
})

// ── GET /api/hitl/pending/all — all docs awaiting human review ─────────
router.get('/pending/all', async (req, res, next) => {
  try {
    const docs = await prisma.document.findMany({
      where: { status: 'READY' },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: { id:true, originalName:true, department:true, metadata:true, updatedAt:true, uploadedBy:{ select:{ name:true } } },
    })

    const pending = docs.map(d => {
      const meta = d.metadata
        ? (() => { try { return typeof d.metadata === 'string' ? JSON.parse(d.metadata) : d.metadata } catch { return {} } })()
        : {}
      return {
        id:            d.id,
        originalName:  d.originalName,
        department:    d.department,
        uploadedBy:    d.uploadedBy?.name,
        updatedAt:     d.updatedAt,
        hitlStatus:    meta.hitl?.status || 'NOT_SUBMITTED',
        hitlScore:     meta.hitl?.score  || null,
        exceptionCount: meta.hitl?.exceptions?.length || 0,
        isVerified:    meta.hitl?.status === 'AUTO_VERIFIED' || meta.hitl?.status === 'HUMAN_VERIFIED',
      }
    })

    res.json({ documents: pending, total: pending.length })
  } catch (err) { next(err) }
})

// ── PATCH /api/hitl/:docId/field — human approves or corrects a field ─
router.patch('/:docId/field', async (req, res, next) => {
  try {
    const { fieldName, action, correctedValue, comment } = req.body
    if (!fieldName || !action) return res.status(400).json({ error: 'fieldName and action are required.' })
    if (!['approve','correct','reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be approve, correct or reject' })
    }

    const doc = await prisma.document.findUnique({ where: { id: req.params.docId } })
    if (!doc) return res.status(404).json({ error: 'Document not found.' })

    const meta = doc.metadata
      ? (() => { try { return typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata } catch { return {} } })()
      : {}

    if (!meta.hitl) return res.status(400).json({ error: 'HITL review not submitted yet.' })

    // Update field status
    meta.hitl.fieldStatuses = meta.hitl.fieldStatuses || {}
    meta.hitl.fieldStatuses[fieldName] = {
      action,
      correctedValue: correctedValue || null,
      comment:        comment || '',
      reviewedBy:     req.user.name,
      reviewedAt:     new Date().toISOString(),
    }

    // If corrected, update knowledge entry
    if (action === 'correct' && correctedValue) {
      await prisma.knowledgeEntry.updateMany({
        where: { documentId: doc.id, fieldName },
        data:  { fieldValue: String(correctedValue), confidence: 1.0 },
      }).catch(() => {})
    }

    // Check if all exceptions have been reviewed
    const pendingExceptions = (meta.hitl.exceptions || []).filter(e =>
      !meta.hitl.fieldStatuses[e.fieldName]
    )

    if (pendingExceptions.length === 0) {
      meta.hitl.status        = 'HUMAN_VERIFIED'
      meta.hitl.verifiedAt    = new Date().toISOString()
      meta.hitl.verifiedBy    = req.user.name
    }

    await prisma.document.update({
      where: { id: doc.id },
      data:  { metadata: JSON.stringify(meta) },
    })

    await prisma.auditLog.create({
      data: {
        userId:   req.user.id,
        action:   `HITL_FIELD_${action.toUpperCase()}`,
        entity:   'Document',
        entityId: doc.id,
        details:  JSON.stringify({ fieldName, action, correctedValue }),
      },
    }).catch(() => {})

    res.json({
      fieldName,
      action,
      hitlStatus:       meta.hitl.status,
      pendingExceptions: pendingExceptions.length,
      message: meta.hitl.status === 'HUMAN_VERIFIED'
        ? 'All exceptions reviewed. Document is now human-verified and ready for report generation.'
        : `${pendingExceptions.length} exception(s) remaining.`,
    })
  } catch (err) { next(err) }
})

// ── PATCH /api/hitl/:docId/approve-all — bulk approve all exceptions ──
router.patch('/:docId/approve-all', async (req, res, next) => {
  try {
    const { comment } = req.body
    const doc = await prisma.document.findUnique({ where: { id: req.params.docId } })
    if (!doc) return res.status(404).json({ error: 'Document not found.' })

    const meta = doc.metadata
      ? (() => { try { return typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata } catch { return {} } })()
      : {}

    if (!meta.hitl) return res.status(400).json({ error: 'HITL review not submitted yet.' })

    meta.hitl.fieldStatuses = meta.hitl.fieldStatuses || {}
    for (const exc of (meta.hitl.exceptions || [])) {
      if (!meta.hitl.fieldStatuses[exc.fieldName]) {
        meta.hitl.fieldStatuses[exc.fieldName] = {
          action:     'approve',
          reviewedBy: req.user.name,
          reviewedAt: new Date().toISOString(),
          comment:    comment || 'Bulk approved by reviewer',
        }
      }
    }
    meta.hitl.status     = 'HUMAN_VERIFIED'
    meta.hitl.verifiedAt = new Date().toISOString()
    meta.hitl.verifiedBy = req.user.name

    await prisma.document.update({
      where: { id: doc.id },
      data:  { metadata: JSON.stringify(meta) },
    })

    await prisma.auditLog.create({
      data: {
        userId:   req.user.id,
        action:   'HITL_BULK_APPROVE',
        entity:   'Document',
        entityId: doc.id,
        details:  JSON.stringify({ comment }),
      },
    }).catch(() => {})

    res.json({ status:'HUMAN_VERIFIED', message:'Document bulk-approved. Ready for report generation.' })
  } catch (err) { next(err) }
})

module.exports = router
