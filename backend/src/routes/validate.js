'use strict'

/**
 * Report AI Validation API
 * POST /api/validate/:reportId   — run AI analysis on a report
 * GET  /api/validate/:reportId   — get existing validation result
 * POST /api/validate/:reportId/approve  — approve the report
 * POST /api/validate/:reportId/reject   — reject with reason
 */

const express = require('express')
const { prisma }      = require('../utils/prisma')
const { authenticate } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)

// ── AI Validation Engine ──────────────────────────────────────────────
function analyzeReport(report, content) {
  const issues  = []
  const passes  = []
  let   score   = 100

  if (!content) return { score: 0, issues: [{ severity:'critical', message:'Report content is empty or unparseable.' }], passes: [], recommendation:'REJECT' }

  const sections = content.sections || []
  const sources  = content.sources  || []
  const summary  = report.summary   || ''

  // ── Rule 1: Summary completeness ──────────────────────────────────
  if (!summary || summary.length < 30) {
    issues.push({ severity:'high', message:'Summary is missing or too short (< 30 chars). A meaningful executive summary is required.' })
    score -= 15
  } else {
    passes.push('Executive summary present and substantive.')
  }

  // ── Rule 2: At least one data section ─────────────────────────────
  const dataSections = sections.filter(s => {
    const d = s.data
    if (!d || d === 'Data not available' || d === 'Insufficient source data') return false
    if (Array.isArray(d) && d.length === 0) return false
    return true
  })
  if (dataSections.length === 0) {
    issues.push({ severity:'critical', message:'No data sections contain actual data. All sections show "Data not available" — report cannot be validated without source data.' })
    score -= 35
  } else {
    passes.push(`${dataSections.length} section(s) contain verifiable data.`)
  }

  // ── Rule 3: Empty / insufficient sections ─────────────────────────
  const emptySections = sections.filter(s => {
    const d = s.data
    return !d || d === 'Data not available' || d === 'Insufficient source data' || (Array.isArray(d) && d.length === 0)
  })
  if (emptySections.length > 0) {
    const names = emptySections.map(s => s.title).join(', ')
    issues.push({ severity: emptySections.length > sections.length / 2 ? 'high' : 'medium',
      message: `${emptySections.length} section(s) lack data: ${names}. Insufficient source data flag present.` })
    score -= emptySections.length * 5
  }

  // ── Rule 4: Source references ─────────────────────────────────────
  if (sources.length === 0) {
    issues.push({ severity:'high', message:'No source references found. All claims must be traceable to source documents for official use.' })
    score -= 20
  } else if (sources.length < 2) {
    issues.push({ severity:'medium', message:'Only 1 source reference. Multiple source documents are recommended for reliability.' })
    score -= 5
    passes.push('At least one source document referenced.')
  } else {
    passes.push(`${sources.length} source reference(s) — full traceability present.`)
  }

  // ── Rule 5: Type-specific checks ─────────────────────────────────
  const type = report.type || ''

  if (type === 'geological') {
    const seamSection = sections.find(s => s.title?.toLowerCase().includes('seam'))
    if (!seamSection || !seamSection.data || seamSection.data === 'Data not available') {
      issues.push({ severity:'medium', message:'Geological report missing seam detail section.' })
      score -= 10
    } else passes.push('Seam data section present.')

    const geoSection = sections.find(s => s.title?.toLowerCase().includes('geological') || s.title?.toLowerCase().includes('overview'))
    if (!geoSection) { issues.push({ severity:'low', message:'No geological overview section found.' }); score -= 5 }
  }

  if (type === 'environmental') {
    const complianceSection = sections.find(s => s.title?.toLowerCase().includes('environmental') || s.title?.toLowerCase().includes('monitoring'))
    if (!complianceSection || !complianceSection.data || complianceSection.data === 'Data not available') {
      issues.push({ severity:'high', message:'Environmental monitoring data section is empty — compliance cannot be verified.' })
      score -= 20
    } else passes.push('Environmental monitoring data present.')
  }

  if (type === 'machinery') {
    const machSection = sections.find(s => s.title?.toLowerCase().includes('machine') || s.title?.toLowerCase().includes('equipment'))
    if (!machSection || !machSection.data || machSection.data === 'Data not available') {
      issues.push({ severity:'medium', message:'Machinery status section is empty.' })
      score -= 10
    } else passes.push('Machinery data section present.')
  }

  if (type === 'reserve' || type === 'production') {
    const prodSection = sections.find(s => s.title?.toLowerCase().includes('production') || s.title?.toLowerCase().includes('reserve'))
    if (!prodSection || !prodSection.data || prodSection.data === 'Data not available') {
      issues.push({ severity:'high', message:'Production/reserve data section is empty. Core purpose of this report type.' })
      score -= 20
    } else passes.push('Production/reserve data section present.')
  }

  // ── Rule 6: Disclaimer present ────────────────────────────────────
  if (!content.disclaimer) {
    issues.push({ severity:'low', message:'No AI disclaimer found. Reports must include a disclaimer about AI-generated content.' })
    score -= 3
  } else passes.push('AI disclaimer present — compliant with transparency requirements.')

  // ── Rule 7: Period specified ──────────────────────────────────────
  if (!report.period || report.period === 'Not specified') {
    issues.push({ severity:'medium', message:'Reporting period not specified. Period is mandatory for official reports.' })
    score -= 8
  } else passes.push(`Reporting period specified: ${report.period}.`)

  // ── Final score and recommendation ────────────────────────────────
  score = Math.max(0, Math.min(100, score))

  const recommendation =
    score >= 80 && !issues.some(i => i.severity === 'critical')  ? 'APPROVE'  :
    score >= 55 && !issues.some(i => i.severity === 'critical')  ? 'REVIEW'   : 'REJECT'

  const summary_ai =
    recommendation === 'APPROVE' ? `Report meets quality standards (score: ${score}/100). Recommended for approval.` :
    recommendation === 'REVIEW'  ? `Report requires corrections before approval (score: ${score}/100). ${issues.length} issue(s) found.` :
    `Report does not meet minimum standards (score: ${score}/100). ${issues.filter(i=>i.severity==='critical').length} critical issue(s) must be resolved.`

  return { score, issues, passes, recommendation, summary: summary_ai }
}

// ── POST /api/validate/:reportId — run analysis ───────────────────────
router.post('/:reportId', async (req, res, next) => {
  try {
    const report = await prisma.report.findUnique({ where: { id: req.params.reportId } })
    if (!report) return res.status(404).json({ error: 'Report not found.' })

    const content = report.content
      ? (() => { try { return typeof report.content === 'string' ? JSON.parse(report.content) : report.content } catch { return null } })()
      : null

    const analysis = analyzeReport(report, content)

    // Store analysis result in report metadata
    await prisma.report.update({
      where: { id: report.id },
      data: {
        content: JSON.stringify({ ...(content || {}), _aiAnalysis: analysis }),
      },
    }).catch(() => {})

    res.json({ reportId: report.id, analysis })
  } catch (err) { next(err) }
})

// ── GET /api/validate/:reportId — get stored analysis ─────────────────
router.get('/:reportId', async (req, res, next) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.reportId },
      include: {
        generatedBy: { select: { name: true, email: true } },
        site:        true,
      },
    })
    if (!report) return res.status(404).json({ error: 'Report not found.' })

    const content = report.content
      ? (() => { try { return typeof report.content === 'string' ? JSON.parse(report.content) : report.content } catch { return null } })()
      : null

    if (content?.content) { try { content.content = JSON.parse(content.content) } catch {} }

    res.json({
      report: { ...report, content },
      analysis: content?._aiAnalysis || null,
    })
  } catch (err) { next(err) }
})

// ── POST /api/validate/:reportId/approve ─────────────────────────────
router.post('/:reportId/approve', async (req, res, next) => {
  try {
    const { comment } = req.body
    const report = await prisma.report.findUnique({ where: { id: req.params.reportId } })
    if (!report) return res.status(404).json({ error: 'Report not found.' })

    const content = report.content
      ? (() => { try { return typeof report.content === 'string' ? JSON.parse(report.content) : report.content } catch { return {} } })()
      : {}

    const updated = await prisma.report.update({
      where: { id: req.params.reportId },
      data: {
        status:  'APPROVED',
        content: JSON.stringify({
          ...content,
          _approval: {
            status:    'APPROVED',
            approvedBy: req.user.name,
            approvedAt: new Date().toISOString(),
            comment:   comment || '',
          },
        }),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId:   req.user.id,
        action:   'APPROVE_REPORT',
        entity:   'Report',
        entityId: req.params.reportId,
        details:  JSON.stringify({ title: report.title, comment }),
      },
    }).catch(() => {})

    res.json({ report: updated, message: 'Report approved successfully.' })
  } catch (err) { next(err) }
})

// ── POST /api/validate/:reportId/reject ──────────────────────────────
router.post('/:reportId/reject', async (req, res, next) => {
  try {
    const { reason } = req.body
    if (!reason?.trim()) return res.status(400).json({ error: 'Rejection reason is required.' })

    const report = await prisma.report.findUnique({ where: { id: req.params.reportId } })
    if (!report) return res.status(404).json({ error: 'Report not found.' })

    const content = report.content
      ? (() => { try { return typeof report.content === 'string' ? JSON.parse(report.content) : report.content } catch { return {} } })()
      : {}

    const updated = await prisma.report.update({
      where: { id: req.params.reportId },
      data: {
        status:  'DRAFT',
        content: JSON.stringify({
          ...content,
          _approval: {
            status:     'REJECTED',
            rejectedBy: req.user.name,
            rejectedAt: new Date().toISOString(),
            reason,
          },
        }),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId:   req.user.id,
        action:   'REJECT_REPORT',
        entity:   'Report',
        entityId: req.params.reportId,
        details:  JSON.stringify({ title: report.title, reason }),
      },
    }).catch(() => {})

    res.json({ report: updated, message: 'Report rejected and returned for revision.' })
  } catch (err) { next(err) }
})

module.exports = router
