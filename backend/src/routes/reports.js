'use strict'

const express = require('express')
const { prisma } = require('../utils/prisma')
const { authenticate } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)

// GET /api/reports
router.get('/', async (req, res, next) => {
  try {
    const { department, type, siteId, status, page = 1, limit = 20 } = req.query
    const where = {}
    if (req.user.role !== 'ADMIN') where.department = req.user.department || req.user.role.toLowerCase()
    if (department) where.department = department
    if (type)       where.type       = type
    if (siteId)     where.siteId     = siteId
    if (status)     where.status     = status

    const [total, reports] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: {
          generatedBy: { select: { name: true } },
          site:        { select: { name: true, code: true } },
        },
      }),
    ])

    res.json({ reports, total, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) { next(err) }
})

// POST /api/reports/generate — generate a new report
router.post('/generate', async (req, res, next) => {
  try {
    const { title, type, department, siteId, period, documentIds } = req.body

    if (!title || !type || !department) {
      return res.status(400).json({ error: 'title, type and department are required.' })
    }

    // Fetch site + data for report content (Promise.all — SQLite compatible)
    const [site, productions, seams, geoData, reserves, envData, machines, riskItems] =
      await Promise.all([
        siteId ? prisma.site.findUnique({ where: { id: siteId } }) : Promise.resolve(null),
        siteId ? prisma.production.findMany({ where: { siteId }, orderBy: { date: 'asc' } }) : Promise.resolve([]),
        siteId ? prisma.geologicalSeam.findMany({ where: { siteId } }) : Promise.resolve([]),
        siteId ? prisma.geologicalData.findMany({ where: { siteId } }) : Promise.resolve([]),
        siteId ? prisma.reserveData.findMany({ where: { siteId } }) : Promise.resolve([]),
        siteId ? prisma.environmentalData.findMany({ where: { siteId }, orderBy: { monitoringDate: 'desc' }, take: 20 }) : Promise.resolve([]),
        siteId ? prisma.machinery.findMany({ where: { siteId } }) : Promise.resolve([]),
        siteId ? prisma.riskItem.findMany({ where: { siteId, status: 'OPEN' } }) : Promise.resolve([]),
      ])

    // Build report content based on type
    const content = buildReportContent({
      type, period, site,
      productions, seams, geoData, reserves,
      envData, machines, riskItems,
    })

    const report = await prisma.report.create({
      data: {
        title,
        type,
        department,
        siteId:       siteId || null,
        period:       period || null,
        summary:      content.summary,
        content:      JSON.stringify(content),   // SQLite: store as JSON string
        status:       'GENERATED',
        generatedById: req.user.id,
      },
    })

    // Link documents if provided
    if (documentIds && documentIds.length > 0) {
      await prisma.reportDocument.createMany({
        data: documentIds.map(docId => ({ reportId: report.id, documentId: docId })),
        skipDuplicates: true,
      })
    }

    res.status(201).json({ report, message: 'Report generated successfully.' })
  } catch (err) { next(err) }
})

// GET /api/reports/:id
router.get('/:id', async (req, res, next) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: {
        generatedBy: { select: { name: true, email: true } },
        site:        true,
        documents:   { include: { document: { select: { originalName: true, status: true } } } },
      },
    })
    if (!report) return res.status(404).json({ error: 'Report not found.' })
    // SQLite: parse content JSON string back to object
    if (report.content && typeof report.content === 'string') {
      try { report.content = JSON.parse(report.content) } catch {}
    }
    res.json({ report })
  } catch (err) { next(err) }
})

// DELETE /api/reports/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.report.delete({ where: { id: req.params.id } })
    res.json({ message: 'Report deleted.' })
  } catch (err) { next(err) }
})

// ── Report content builder ────────────────────────────────────────────
function buildReportContent({ type, period, site, productions, seams, geoData, reserves, envData, machines, riskItems }) {
  const now     = new Date().toISOString()
  const siteName = site?.name || 'All Sites'

  const sources = []

  let summary = ''
  let sections = []

  if (type === 'production' || type === 'official') {
    const totalProd = productions.reduce((s, r) => s + r.productionMT, 0)
    summary = `Production report for ${siteName}. Total recorded production: ${totalProd.toFixed(2)} MT across ${productions.length} records.`
    if (productions.length === 0) summary = 'Data not available — no production records found for the selected period.'

    sections.push({
      title: 'Production Summary',
      data: productions.length > 0 ? {
        total:   +totalProd.toFixed(3),
        records: productions.length,
        byYear:  groupByYear(productions),
      } : 'Insufficient source data',
      note: productions.length === 0 ? 'No production data available for this site/period.' : null,
    })

    productions.forEach(r => {
      if (r.sourceDoc) sources.push({ value: `${r.productionMT} MT`, source: r.source, doc: r.sourceDoc, page: r.sourcePage })
    })
  }

  if (type === 'geological') {
    const seamCount = seams.length
    const avgThick  = seams.length ? (seams.reduce((s, x) => s + (x.thickness || 0), 0) / seams.length).toFixed(2) : null
    summary = `Geological report for ${siteName}. ${seamCount} seams identified. Average thickness: ${avgThick ? avgThick + ' m' : 'Data not available'}.`

    sections.push({
      title: 'Geological Overview',
      data: geoData.length > 0 ? geoData : 'Data not available',
    })
    sections.push({
      title: 'Seam Details',
      data: seams.length > 0 ? seams.map(s => ({
        seam: s.seamName, thicknessM: s.thickness, depthM: s.depth,
        grade: s.gradeDesignation, gcv: s.gCV,
        source: s.source, doc: s.sourceDoc, page: s.sourcePage,
      })) : 'Data not available',
    })

    seams.forEach(s => {
      if (s.sourceDoc) sources.push({ value: `Seam ${s.seamName}`, source: s.source, doc: s.sourceDoc, page: s.sourcePage })
    })
  }

  if (type === 'reserve') {
    const totalReserve  = reserves.reduce((s, r) => s + (r.totalReserveMT || 0), 0)
    const mineable      = reserves.reduce((s, r) => s + (r.mineableReserveMT || 0), 0)
    summary = reserves.length > 0
      ? `Reserve report for ${siteName}. Total reserve: ${totalReserve.toFixed(2)} MT, Mineable: ${mineable.toFixed(2)} MT.`
      : 'Insufficient source data — no reserve records found.'

    sections.push({
      title: 'Reserve Data',
      data: reserves.length > 0 ? reserves.map(r => ({
        block: r.blockName, category: r.category,
        totalMT: r.totalReserveMT ?? 'Insufficient source data',
        mineableMT: r.mineableReserveMT ?? 'Insufficient source data',
        status: r.verificationStatus,
        source: r.source, doc: r.sourceDoc, page: r.sourcePage,
      })) : 'Insufficient source data',
    })
  }

  if (type === 'environmental') {
    const nonCompliant = envData.filter(r => r.compliant === false).length
    summary = `Environmental report for ${siteName}. ${envData.length} monitoring records. Non-compliant: ${nonCompliant}.`
    if (envData.length === 0) summary = 'Data not available — no environmental monitoring records found.'

    sections.push({
      title: 'Environmental Monitoring',
      data: envData.length > 0 ? envData.map(r => ({
        date: r.monitoringDate, type: r.paramType, parameter: r.parameter,
        value: r.value, unit: r.unit, standard: r.standard,
        compliant: r.compliant, source: r.source, doc: r.sourceDoc, page: r.sourcePage,
      })) : 'Data not available',
    })
  }

  if (type === 'machinery') {
    const operational = machines.filter(m => m.status === 'OPERATIONAL').length
    summary = `Machinery report for ${siteName}. ${machines.length} machines, ${operational} operational.`
    if (machines.length === 0) summary = 'Data not available — no machinery records found.'

    sections.push({
      title: 'Machinery Status',
      data: machines.length > 0 ? machines.map(m => ({
        id: m.machineId, name: m.name, type: m.type,
        status: m.status, make: m.make, model: m.model,
      })) : 'Data not available',
    })
  }

  // Risk section for all report types
  if (riskItems.length > 0) {
    sections.push({
      title: 'Active Risks',
      data: riskItems.map(r => ({
        title: r.title, level: r.level, category: r.category,
        severity: r.severity, likelihood: r.likelihood,
      })),
    })
  }

  return {
    generatedAt: now,
    reportType:  type,
    period:      period || 'Not specified',
    site:        site ? { id: site.id, name: site.name, code: site.code } : { name: 'All Sites' },
    summary,
    sections,
    sources,
    disclaimer: 'This report is AI-generated based on available structured data. All values reference source documents where available.',
  }
}

function groupByYear(productions) {
  const map = {}
  for (const r of productions) {
    if (!map[r.year]) map[r.year] = { year: r.year, productionMT: 0 }
    map[r.year].productionMT += r.productionMT
  }
  return Object.values(map).sort((a, b) => a.year - b.year)
}

module.exports = router
