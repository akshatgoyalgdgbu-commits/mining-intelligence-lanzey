'use strict'

const express = require('express')
const { prisma } = require('../utils/prisma')
const { authenticate } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)

// GET /api/sites
router.get('/', async (req, res, next) => {
  try {
    const { company, state, type } = req.query
    const where = {}
    if (company) where.company = company
    if (state)   where.state   = state
    if (type)    where.type    = type

    const sites = await prisma.site.findMany({
      where: { active: true, ...where },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true, location: true, state: true, company: true, type: true },
    })
    res.json({ sites })
  } catch (err) { next(err) }
})

// GET /api/sites/:id
router.get('/:id', async (req, res, next) => {
  try {
    const site = await prisma.site.findUnique({ where: { id: req.params.id } })
    if (!site) return res.status(404).json({ error: 'Site not found.' })
    res.json({ site })
  } catch (err) { next(err) }
})

module.exports = router
