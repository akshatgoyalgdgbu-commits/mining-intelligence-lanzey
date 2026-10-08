'use strict'

/**
 * Ask LANZEY — Natural language query engine.
 * Parses intent from question, queries PostgreSQL, returns structured answer + sources.
 * No fake data: if data unavailable, says so clearly.
 */

const express = require('express')
const { prisma } = require('../utils/prisma')
const { authenticate } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)

// POST /api/query
router.post('/', async (req, res, next) => {
  try {
    const { question } = req.body
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required.' })
    }

    const q = question.toLowerCase()

    // ── Intent parsing ──────────────────────────────────────────
    const intent = parseIntent(q)

    // ── Execute query based on intent ───────────────────────────
    const result = await executeQuery(intent, question)

    res.json({
      question,
      intent,
      answer:     result.answer,
      data:       result.data,
      chartType:  result.chartType,
      sources:    result.sources,
      confidence: result.confidence,
      disclaimer: result.data === null
        ? 'No data found matching your query. Please ensure data has been imported.'
        : 'Answer generated from structured database records.',
    })
  } catch (err) { next(err) }
})

// POST /api/query/official — Official/Parliamentary Query Assistant
router.post('/official', async (req, res, next) => {
  try {
    const { question, mineName, fromYear, toYear, dataType } = req.body
    if (!question) return res.status(400).json({ error: 'Question is required.' })

    // Find site if mineName given
    let site = null
    if (mineName) {
      site = await prisma.site.findFirst({
        where: { name: { contains: mineName, mode: 'insensitive' } },
      })
    }

    // Fetch production trend
    const from = fromYear || new Date().getFullYear() - 4
    const to   = toYear   || new Date().getFullYear()

    const where = { year: { gte: from, lte: to } }
    if (site) where.siteId = site.id

    const productions = await prisma.production.findMany({
      where,
      orderBy: { date: 'asc' },
      include: { site: { select: { name: true, code: true } } },
    })

    // Group by year
    const byYear = {}
    for (let y = from; y <= to; y++) byYear[y] = { year: y, productionMT: 0, records: 0 }
    for (const r of productions) {
      if (byYear[r.year]) {
        byYear[r.year].productionMT += r.productionMT
        byYear[r.year].records      += 1
      }
    }

    const trend = Object.values(byYear)
    const totalProd = trend.reduce((s, r) => s + r.productionMT, 0)

    const sources = [...new Set(productions.filter(r => r.sourceDoc).map(r => ({
      doc: r.sourceDoc, page: r.sourcePage, source: r.source,
    })))]

    let answer
    if (productions.length === 0) {
      answer = `Data not available — no production records found for ${site?.name || mineName || 'the requested mine'} from ${from} to ${to}.`
    } else {
      answer = `Production trend for ${site?.name || 'all mines'} from ${from}–${to}:\n\n`
      trend.forEach(t => {
        answer += `• ${t.year}: ${t.productionMT.toFixed(2)} MT\n`
      })
      answer += `\nTotal (${from}–${to}): ${totalProd.toFixed(2)} MT`
    }

    res.json({
      question,
      siteName: site?.name || mineName || 'All Mines',
      fromYear: from,
      toYear:   to,
      answer,
      trend,
      chartType: 'line',
      sources,
      confidence: productions.length > 0 ? 0.92 : 0.1,
      exportable: true,
    })
  } catch (err) { next(err) }
})

// ── Intent parsing ────────────────────────────────────────────────────
function parseIntent(q) {
  if (q.includes('production') || q.includes('produc') || q.includes('mt') || q.includes('tonne'))
    return 'production_query'
  if (q.includes('seam') || q.includes('geological') || q.includes('geology') || q.includes('strata'))
    return 'geology_query'
  if (q.includes('reserve') || q.includes('resources'))
    return 'reserve_query'
  if (q.includes('machine') || q.includes('machinery') || q.includes('equipment'))
    return 'machinery_query'
  if (q.includes('environment') || q.includes('compliance') || q.includes('pollution') || q.includes('emission'))
    return 'environment_query'
  if (q.includes('risk') || q.includes('hazard') || q.includes('safety'))
    return 'risk_query'
  if (q.includes('document') || q.includes('report') || q.includes('file'))
    return 'document_query'
  if (q.includes('dispatch') || q.includes('transport'))
    return 'dispatch_query'
  return 'general'
}

// ── Query executor ────────────────────────────────────────────────────
async function executeQuery(intent, originalQuestion) {
  const q = originalQuestion.toLowerCase()

  // Extract mine name hints
  const mineMatch = q.match(/mine\s+([a-z0-9\s]+?)(?:\s+mine)?(?:\s+production|\s+seam|\s+reserve|\s+data|$)/i)
  const mineName  = mineMatch?.[1]?.trim()

  // Extract year hints
  const yearMatch = q.match(/(\d{4})/g)
  const years     = yearMatch ? yearMatch.map(Number) : []

  let site = null
  if (mineName) {
    site = await prisma.site.findFirst({
      where: { name: { contains: mineName, mode: 'insensitive' } },
    })
  }

  switch (intent) {
    case 'production_query': {
      const where = {}
      if (site) where.siteId = site.id
      if (years.length === 1) where.year = years[0]
      if (years.length === 2) where.year = { gte: Math.min(...years), lte: Math.max(...years) }

      const records = await prisma.production.findMany({
        where,
        orderBy: { date: 'asc' },
        take: 200,
        include: { site: { select: { name: true } } },
      })

      if (records.length === 0) {
        return { answer: 'Data not available — no production records match your query.', data: null, sources: [], confidence: 0.1 }
      }

      const total = records.reduce((s, r) => s + r.productionMT, 0)
      const byYear = groupBy(records, 'year', r => r.productionMT)

      return {
        answer: `Found ${records.length} production records. Total: ${total.toFixed(2)} MT.\n${Object.entries(byYear).map(([y, v]) => `• ${y}: ${v.toFixed(2)} MT`).join('\n')}`,
        data: { type: 'production', records: byYear },
        chartType: 'bar',
        sources: extractSources(records),
        confidence: 0.91,
      }
    }

    case 'geology_query': {
      const where = site ? { siteId: site.id } : {}
      const [seams, geoData, kbEntries] = await Promise.all([
        prisma.geologicalSeam.findMany({ where, include: { site: { select: { name: true } } } }),
        prisma.geologicalData.findMany({ where, include: { site: { select: { name: true } } } }),
        prisma.knowledgeEntry.findMany({
          where: { department: 'geological', ...(site ? { siteId: site.id } : {}) },
          orderBy: { extractedAt: 'desc' }, take: 20,
          include: { document: { select: { originalName: true } } },
        }).catch(() => []),
      ])

      const totalEntries = seams.length + geoData.length + kbEntries.length
      if (totalEntries === 0) {
        return { answer: 'Data not available — no geological data found.', data: null, sources: [], confidence: 0.1 }
      }

      const kbSummary = kbEntries.length
        ? `\n\nKnowledge base: ${kbEntries.length} extracted fields from uploaded documents.`
        : ''

      return {
        answer: `${seams.length} geological seams found across ${[...new Set(seams.map(s => s.siteId))].length} sites.${kbSummary}`,
        data:  { type: 'geology', seams, geoData, knowledgeEntries: kbEntries },
        chartType: 'table',
        sources: [...extractSources(seams), ...kbEntries.slice(0,3).map(e => ({ doc: e.document?.originalName, source: `Extracted: ${e.fieldName}` }))],
        confidence: 0.88,
      }
    }

    case 'reserve_query': {
      const where = site ? { siteId: site.id } : {}
      const reserves = await prisma.reserveData.findMany({ where, include: { site: { select: { name: true } } } })

      if (reserves.length === 0) {
        return { answer: 'Insufficient source data — no reserve records found.', data: null, sources: [], confidence: 0.1 }
      }

      const total = reserves.reduce((s, r) => s + (r.totalReserveMT || 0), 0)
      return {
        answer: `${reserves.length} reserve records found. Total estimated reserve: ${total > 0 ? total.toFixed(2) + ' MT' : 'Insufficient source data'}.`,
        data:   { type: 'reserve', records: reserves },
        chartType: 'table',
        sources: extractSources(reserves),
        confidence: reserves.some(r => r.verificationStatus === 'verified') ? 0.92 : 0.65,
      }
    }

    case 'machinery_query': {
      const where = site ? { siteId: site.id } : {}
      const machines = await prisma.machinery.findMany({ where })

      if (machines.length === 0) {
        return { answer: 'Data not available — no machinery records found.', data: null, sources: [], confidence: 0.1 }
      }

      const operational = machines.filter(m => m.status === 'OPERATIONAL').length
      return {
        answer: `${machines.length} machines found. ${operational} operational, ${machines.length - operational} not operational.`,
        data:   { type: 'machinery', machines },
        chartType: 'table',
        sources: [],
        confidence: 0.95,
      }
    }

    case 'risk_query': {
      const risks = await prisma.riskItem.findMany({ where: { status: 'OPEN' } })
      return {
        answer: `${risks.length} open risks. Critical: ${risks.filter(r => r.level === 'critical').length}, High: ${risks.filter(r => r.level === 'high').length}.`,
        data:   { type: 'risk', risks },
        chartType: 'table',
        sources: extractSources(risks),
        confidence: 0.90,
      }
    }

    default: {
      const [docCount, siteCount, prodCount] = await Promise.all([
        prisma.document.count(),
        prisma.site.count(),
        prisma.production.count(),
      ])
      return {
        answer: `LANZEY knowledge base contains: ${docCount} documents, ${siteCount} mine sites, ${prodCount} production records. Please ask a more specific question.`,
        data:   { type: 'general', docCount, siteCount, prodCount },
        chartType: null,
        sources: [],
        confidence: 0.5,
      }
    }
  }
}

function groupBy(records, field, valueFn) {
  const map = {}
  for (const r of records) {
    const key = r[field]
    if (!map[key]) map[key] = 0
    map[key] += valueFn(r)
  }
  return map
}

function extractSources(records) {
  return records
    .filter(r => r.sourceDoc || r.source)
    .slice(0, 5)
    .map(r => ({ doc: r.sourceDoc, page: r.sourcePage, source: r.source }))
}

module.exports = router
