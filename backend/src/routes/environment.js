'use strict'

const express = require('express')
const { prisma } = require('../utils/prisma')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)
router.use(authorize('ADMIN','ENVIRONMENT','CIL'))

// GET /api/environment?siteId=&paramType=&compliant=
router.get('/', async (req, res, next) => {
  try {
    const { siteId, paramType, compliant, from, to } = req.query
    const where = {}
    if (siteId)    where.siteId    = siteId
    if (paramType) where.paramType = paramType
    if (compliant !== undefined) where.compliant = compliant === 'true'
    if (from || to) {
      where.monitoringDate = {}
      if (from) where.monitoringDate.gte = new Date(from)
      if (to)   where.monitoringDate.lte = new Date(to)
    }

    const records = await prisma.environmentalData.findMany({
      where,
      orderBy: { monitoringDate: 'desc' },
      include: { site: { select: { name: true, code: true } } },
    })

    res.json({ records, total: records.length })
  } catch (err) { next(err) }
})

// GET /api/environment/compliance-summary
router.get('/compliance-summary', async (req, res, next) => {
  try {
    const { siteId } = req.query
    const where = siteId ? { siteId: String(siteId) } : {}

    const [total, compliant, nonCompliant] = await Promise.all([
      prisma.environmentalData.count({ where }),
      prisma.environmentalData.count({ where: { ...where, compliant: true } }),
      prisma.environmentalData.count({ where: { ...where, compliant: false } }),
    ])

    const byType = await prisma.environmentalData.groupBy({
      by: ['paramType'],
      where,
      _count: { id: true },
    })

    res.json({
      total,
      compliant,
      nonCompliant,
      complianceRate: total > 0 ? +((compliant / total) * 100).toFixed(1) : 0,
      byType,
    })
  } catch (err) { next(err) }
})

module.exports = router
