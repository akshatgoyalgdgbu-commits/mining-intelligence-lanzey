'use strict'

const express = require('express')
const { prisma } = require('../utils/prisma')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)
router.use(authorize('ADMIN','GEOLOGICAL','CMPDI','RESERVE_CHECKER'))

// GET /api/geology?siteId=
router.get('/', async (req, res, next) => {
  try {
    const { siteId } = req.query
    const where = siteId ? { siteId } : {}

    const [geoData, seams] = await Promise.all([
      prisma.geologicalData.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { site: { select: { name: true, code: true } } },
      }),
      prisma.geologicalSeam.findMany({
        where,
        orderBy: { seamName: 'asc' },
        include: { site: { select: { name: true, code: true } } },
      }),
    ])

    res.json({ geologicalData: geoData, seams })
  } catch (err) { next(err) }
})

// GET /api/geology/seams?siteId=
router.get('/seams', async (req, res, next) => {
  try {
    const { siteId } = req.query
    const seams = await prisma.geologicalSeam.findMany({
      where: siteId ? { siteId: String(siteId) } : {},
      orderBy: [{ siteId: 'asc' }, { seamName: 'asc' }],
      include: { site: { select: { name: true, code: true } } },
    })
    res.json({ seams, total: seams.length })
  } catch (err) { next(err) }
})

// GET /api/geology/summary
router.get('/summary', async (req, res, next) => {
  try {
    const [totalSeams, totalBlocks, sitesWithData] = await Promise.all([
      prisma.geologicalSeam.count(),
      prisma.geologicalData.count(),
      prisma.geologicalData.findMany({ distinct: ['siteId'], select: { siteId: true } }),
    ])

    const avgThickness = await prisma.geologicalSeam.aggregate({
      _avg: { thickness: true },
    })

    res.json({
      totalSeams,
      totalBlocks,
      sitesWithData: sitesWithData.length,
      avgSeamThicknessMt: avgThickness._avg.thickness?.toFixed(2),
    })
  } catch (err) { next(err) }
})

// GET /api/geology/:siteId/detail
router.get('/:siteId/detail', async (req, res, next) => {
  try {
    const siteId = req.params.siteId
    const [site, geoData, seams, reserves] = await Promise.all([
      prisma.site.findUnique({ where: { id: siteId } }),
      prisma.geologicalData.findMany({ where: { siteId } }),
      prisma.geologicalSeam.findMany({ where: { siteId }, orderBy: { seamName: 'asc' } }),
      prisma.reserveData.findMany({ where: { siteId } }),
    ])

    if (!site) return res.status(404).json({ error: 'Site not found.' })
    res.json({ site, geologicalData: geoData, seams, reserves })
  } catch (err) { next(err) }
})

module.exports = router
