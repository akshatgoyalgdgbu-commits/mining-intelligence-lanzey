'use strict'

const express = require('express')
const { prisma } = require('../utils/prisma')
const { authenticate } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)

// GET /api/risk?category=&level=&siteId=
router.get('/', async (req, res, next) => {
  try {
    const { category, level, siteId, status } = req.query
    const where = {}
    if (category) where.category = category
    if (level)    where.level    = level
    if (siteId)   where.siteId   = siteId
    if (status)   where.status   = status

    const risks = await prisma.riskItem.findMany({
      where,
      orderBy: [{ level: 'asc' }, { severity: 'desc' }],
      include: { site: { select: { name: true, code: true } } },
    })
    // Parse controls JSON string → array
    const parsed = risks.map(r => ({
      ...r,
      controls: r.controls ? (() => { try { return JSON.parse(r.controls) } catch { return [] } })() : [],
    }))
    res.json({ risks: parsed, total: parsed.length })
  } catch (err) { next(err) }
})

// GET /api/risk/summary
router.get('/summary', async (req, res, next) => {
  try {
    const [total, critical, high, medium, low] = await Promise.all([
      prisma.riskItem.count({ where: { status: 'OPEN' } }),
      prisma.riskItem.count({ where: { level: 'critical', status: 'OPEN' } }),
      prisma.riskItem.count({ where: { level: 'high',     status: 'OPEN' } }),
      prisma.riskItem.count({ where: { level: 'medium',   status: 'OPEN' } }),
      prisma.riskItem.count({ where: { level: 'low',      status: 'OPEN' } }),
    ])

    const avgScore = await prisma.riskItem.aggregate({
      where: { status: 'OPEN' },
      _avg: { severity: true, likelihood: true },
    })

    res.json({
      total, critical, high, medium, low,
      avgScore: avgScore._avg.severity && avgScore._avg.likelihood
        ? +((avgScore._avg.severity * avgScore._avg.likelihood)).toFixed(1)
        : null,
    })
  } catch (err) { next(err) }
})

// GET /api/risk/:id
router.get('/:id', async (req, res, next) => {
  try {
    const risk = await prisma.riskItem.findUnique({
      where: { id: req.params.id },
      include: { site: { select: { name: true, code: true } } },
    })
    if (!risk) return res.status(404).json({ error: 'Risk not found.' })
    if (risk.controls && typeof risk.controls === 'string') {
      try { risk.controls = JSON.parse(risk.controls) } catch { risk.controls = [] }
    }
    res.json({ risk })
  } catch (err) { next(err) }
})

module.exports = router
