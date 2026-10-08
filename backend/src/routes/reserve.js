'use strict'

const express = require('express')
const { prisma } = require('../utils/prisma')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)
router.use(authorize('ADMIN','RESERVE_CHECKER','GEOLOGICAL','CMPDI'))

// GET /api/reserve?siteId=&category=
router.get('/', async (req, res, next) => {
  try {
    const { siteId, category, verificationStatus } = req.query
    const where = {}
    if (siteId)             where.siteId             = siteId
    if (category)           where.category           = category
    if (verificationStatus) where.verificationStatus = verificationStatus

    const records = await prisma.reserveData.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { site: { select: { name: true, code: true, state: true } } },
    })

    res.json({ records, total: records.length })
  } catch (err) { next(err) }
})

// GET /api/reserve/summary
router.get('/summary', async (req, res, next) => {
  try {
    const { siteId } = req.query
    const where = siteId ? { siteId } : {}

    const agg = await prisma.reserveData.aggregate({
      where,
      _sum: { totalReserveMT: true, mineableReserveMT: true },
      _count: { id: true },
    })

    const [verified, pending, insufficient] = await Promise.all([
      prisma.reserveData.count({ where: { ...where, verificationStatus: 'verified' } }),
      prisma.reserveData.count({ where: { ...where, verificationStatus: 'pending' } }),
      prisma.reserveData.count({ where: { ...where, verificationStatus: 'insufficient_data' } }),
    ])

    res.json({
      totalRecords:        agg._count.id,
      totalReserveMT:      agg._sum.totalReserveMT     ? +agg._sum.totalReserveMT.toFixed(2)     : 'Insufficient source data',
      mineableReserveMT:   agg._sum.mineableReserveMT  ? +agg._sum.mineableReserveMT.toFixed(2)  : 'Insufficient source data',
      verified,
      pending,
      insufficient,
    })
  } catch (err) { next(err) }
})

module.exports = router
