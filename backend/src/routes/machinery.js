'use strict'

const express = require('express')
const { prisma } = require('../utils/prisma')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)
router.use(authorize('ADMIN','MACHINERY','CIL'))

// GET /api/machinery?siteId=&status=&type=
router.get('/', async (req, res, next) => {
  try {
    const { siteId, status, type } = req.query
    const where = {}
    if (siteId) where.siteId = siteId
    if (status) where.status = status
    if (type)   where.type   = type

    const machines = await prisma.machinery.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        site: { select: { name: true, code: true } },
        _count: { select: { maintenance: true } },
      },
    })
    res.json({ machinery: machines, total: machines.length })
  } catch (err) { next(err) }
})

// GET /api/machinery/summary
router.get('/summary', async (req, res, next) => {
  try {
    const [total, operational, breakdown, maintenance, idle] = await Promise.all([
      prisma.machinery.count(),
      prisma.machinery.count({ where: { status: 'OPERATIONAL' } }),
      prisma.machinery.count({ where: { status: 'BREAKDOWN' } }),
      prisma.machinery.count({ where: { status: 'MAINTENANCE' } }),
      prisma.machinery.count({ where: { status: 'IDLE' } }),
    ])

    const utilization = total > 0 ? ((operational / total) * 100).toFixed(1) : 0

    res.json({ total, operational, breakdown, maintenance, idle, utilizationPct: +utilization })
  } catch (err) { next(err) }
})

// GET /api/machinery/:id
router.get('/:id', async (req, res, next) => {
  try {
    const machine = await prisma.machinery.findUnique({
      where: { id: req.params.id },
      include: {
        site:        { select: { name: true, code: true } },
        maintenance: { orderBy: { startDate: 'desc' }, take: 20 },
        telemetry:   { orderBy: { recordedAt: 'desc' }, take: 10 },
      },
    })
    if (!machine) return res.status(404).json({ error: 'Machine not found.' })
    res.json({ machine })
  } catch (err) { next(err) }
})

// GET /api/machinery/:id/telemetry
router.get('/:id/telemetry', async (req, res, next) => {
  try {
    const { limit = 50 } = req.query
    const telemetry = await prisma.telemetry.findMany({
      where: { machineryId: req.params.id },
      orderBy: { recordedAt: 'desc' },
      take: parseInt(limit),
    })
    res.json({ telemetry })
  } catch (err) { next(err) }
})

// GET /api/machinery/:id/maintenance
router.get('/:id/maintenance', async (req, res, next) => {
  try {
    const records = await prisma.maintenance.findMany({
      where: { machineryId: req.params.id },
      orderBy: { startDate: 'desc' },
    })
    res.json({ maintenance: records })
  } catch (err) { next(err) }
})

module.exports = router
