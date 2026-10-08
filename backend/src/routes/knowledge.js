'use strict'

/**
 * Knowledge Base API
 * Serves extracted fields from all processed documents.
 * Powers: KnowledgeBasePage, AskLanzey enriched answers, trend data, reports.
 */

const express = require('express')
const { prisma }      = require('../utils/prisma')
const { authenticate } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)

// ── GET /api/knowledge — browse all knowledge entries ─────────────────
router.get('/', async (req, res, next) => {
  try {
    const { department, siteId, fieldName, documentId, page = 1, limit = 50 } = req.query
    const where = {}
    if (department)  where.department  = department
    if (siteId)      where.siteId      = siteId
    if (fieldName)   where.fieldName   = fieldName
    if (documentId)  where.documentId  = documentId

    const [total, entries] = await Promise.all([
      prisma.knowledgeEntry.count({ where }),
      prisma.knowledgeEntry.findMany({
        where,
        orderBy: { extractedAt: 'desc' },
        skip:  (parseInt(page) - 1) * parseInt(limit),
        take:  parseInt(limit),
        include: {
          document: { select: { originalName: true, status: true, createdAt: true } },
          site:     { select: { name: true, code: true } },
        },
      }),
    ])

    res.json({ entries, total, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) { next(err) }
})

// ── GET /api/knowledge/summary — field counts by department ──────────
router.get('/summary', async (req, res, next) => {
  try {
    const { department } = req.query
    const where = department ? { department } : {}

    const [total, byDept, byField, recentDocs] = await Promise.all([
      prisma.knowledgeEntry.count({ where }),
      prisma.knowledgeEntry.groupBy({
        by: ['department'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.knowledgeEntry.groupBy({
        by: ['fieldName'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.document.findMany({
        where: { status: 'READY', ...(department ? { department } : {}) },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, originalName: true, department: true, updatedAt: true },
      }),
    ])

    res.json({ total, byDepartment: byDept, topFields: byField, recentDocuments: recentDocs })
  } catch (err) { next(err) }
})

// ── GET /api/knowledge/search?q=&department= ─────────────────────────
router.get('/search', async (req, res, next) => {
  try {
    const { q, department, siteId, fieldName, limit = 20 } = req.query
    if (!q) return res.status(400).json({ error: 'Query parameter q is required.' })

    const where = {
      fieldValue: { contains: q },
    }
    if (department) where.department = department
    if (siteId)     where.siteId     = siteId
    if (fieldName)  where.fieldName  = fieldName

    const entries = await prisma.knowledgeEntry.findMany({
      where,
      take: parseInt(limit),
      orderBy: { confidence: 'desc' },
      include: {
        document: { select: { originalName: true, createdAt: true } },
        site:     { select: { name: true, code: true } },
      },
    })

    res.json({ results: entries, total: entries.length, query: q })
  } catch (err) { next(err) }
})

// ── GET /api/knowledge/document/:docId — all fields for one doc ──────
router.get('/document/:docId', async (req, res, next) => {
  try {
    const entries = await prisma.knowledgeEntry.findMany({
      where: { documentId: req.params.docId },
      orderBy: { fieldName: 'asc' },
    })
    res.json({ entries, total: entries.length })
  } catch (err) { next(err) }
})

// ── GET /api/knowledge/trend?fieldName=productionMT&siteId= ─────────
// Returns time-series of a field value from multiple documents
router.get('/trend', async (req, res, next) => {
  try {
    const { fieldName, department, siteId } = req.query
    if (!fieldName) return res.status(400).json({ error: 'fieldName is required.' })

    const where = { fieldName }
    if (department) where.department = department
    if (siteId)     where.siteId     = siteId

    const entries = await prisma.knowledgeEntry.findMany({
      where,
      orderBy: { extractedAt: 'asc' },
      include: {
        document: { select: { originalName: true, createdAt: true } },
        site:     { select: { name: true, code: true } },
      },
    })

    // Build trend series
    const series = entries.map(e => ({
      date:       e.document.createdAt,
      value:      isNaN(parseFloat(e.fieldValue)) ? e.fieldValue : parseFloat(e.fieldValue),
      fieldValue: e.fieldValue,
      source:     e.document.originalName,
      site:       e.site?.name || null,
      confidence: e.confidence,
    }))

    res.json({ fieldName, series, total: series.length })
  } catch (err) { next(err) }
})

// ── DELETE /api/knowledge/:id ────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.knowledgeEntry.delete({ where: { id: req.params.id } })
    res.json({ message: 'Knowledge entry deleted.' })
  } catch (err) { next(err) }
})

module.exports = router
