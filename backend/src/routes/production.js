'use strict'

const express = require('express')
const { prisma } = require('../utils/prisma')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)

// GET /api/production?siteId=&year=&from=&to=
router.get('/', async (req, res, next) => {
  try {
    const { siteId, year, from, to, groupBy } = req.query
    const where = {}
    if (siteId) where.siteId = siteId
    if (year)   where.year   = parseInt(year)
    if (from || to) {
      where.date = {}
      if (from) where.date.gte = new Date(from)
      if (to)   where.date.lte = new Date(to)
    }

    const records = await prisma.production.findMany({
      where,
      orderBy: { date: 'asc' },
      include: { site: { select: { name: true, code: true, company: true } } },
    })

    // Group by year if requested
    if (groupBy === 'year') {
      const grouped = {}
      for (const r of records) {
        const key = r.year
        if (!grouped[key]) grouped[key] = { year: key, productionMT: 0, targetMT: 0, count: 0 }
        grouped[key].productionMT += r.productionMT
        grouped[key].targetMT     += r.targetMT || 0
        grouped[key].count        += 1
      }
      return res.json({ data: Object.values(grouped).sort((a, b) => a.year - b.year) })
    }

    if (groupBy === 'site') {
      const grouped = {}
      for (const r of records) {
        const key = r.siteId
        if (!grouped[key]) grouped[key] = {
          siteId: key,
          siteName: r.site?.name,
          siteCode: r.site?.code,
          productionMT: 0, count: 0,
        }
        grouped[key].productionMT += r.productionMT
        grouped[key].count        += 1
      }
      return res.json({ data: Object.values(grouped) })
    }

    res.json({ records, total: records.length })
  } catch (err) { next(err) }
})

// GET /api/production/summary — KPI summary
router.get('/summary', async (req, res, next) => {
  try {
    const { siteId, year } = req.query
    const currentYear = year ? parseInt(year) : new Date().getFullYear()

    const where = { year: currentYear }
    if (siteId) where.siteId = siteId

    const [currentYearData, allSites, totalDocs] = await Promise.all([
      prisma.production.findMany({ where }),
      prisma.site.count({ where: { active: true } }),
      prisma.document.count(),
    ])

    const totalProduction = currentYearData.reduce((s, r) => s + r.productionMT, 0)
    const totalTarget     = currentYearData.reduce((s, r) => s + (r.targetMT || 0), 0)
    const achievementPct  = totalTarget > 0 ? ((totalProduction / totalTarget) * 100).toFixed(1) : null

    res.json({
      year: currentYear,
      totalProductionMT: +totalProduction.toFixed(3),
      totalTargetMT:     +totalTarget.toFixed(3),
      achievementPct,
      totalSites:        allSites,
      totalDocuments:    totalDocs,
      recordCount:       currentYearData.length,
    })
  } catch (err) { next(err) }
})

// GET /api/production/trend?siteId=&years=5
router.get('/trend', async (req, res, next) => {
  try {
    const { siteId, years = 5 } = req.query
    const currentYear = new Date().getFullYear()
    const fromYear    = currentYear - parseInt(years) + 1

    const where = { year: { gte: fromYear } }
    if (siteId) where.siteId = siteId

    const records = await prisma.production.findMany({
      where,
      orderBy: { date: 'asc' },
    })

    // Group by year
    const byYear = {}
    for (let y = fromYear; y <= currentYear; y++) byYear[y] = { year: y, productionMT: 0, targetMT: 0 }
    for (const r of records) {
      if (byYear[r.year]) {
        byYear[r.year].productionMT += r.productionMT
        byYear[r.year].targetMT     += r.targetMT || 0
      }
    }

    res.json({
      trend: Object.values(byYear),
      siteId: siteId || 'all',
      years: parseInt(years),
    })
  } catch (err) { next(err) }
})

module.exports = router
