'use strict'

const express  = require('express')
const bcrypt   = require('bcryptjs')
const { prisma } = require('../utils/prisma')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()
router.use(authenticate)
router.use(authorize('ADMIN'))

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, department: true, active: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ users })
  } catch (err) { next(err) }
})

// PATCH /api/admin/users/:id
router.patch('/users/:id', async (req, res, next) => {
  try {
    const { name, role, department, active, password } = req.body
    const data = {}
    if (name !== undefined)       data.name       = name
    if (role !== undefined)       data.role       = role
    if (department !== undefined) data.department = department
    if (active !== undefined)     data.active     = active
    if (password)                 data.passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, email: true, name: true, role: true, department: true, active: true },
    })
    res.json({ user })
  } catch (err) { next(err) }
})

// GET /api/admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    const [users, docs, reports, sites, risks, auditLogs] = await Promise.all([
      prisma.user.count(),
      prisma.document.count(),
      prisma.report.count(),
      prisma.site.count(),
      prisma.riskItem.count({ where: { status: 'OPEN' } }),
      prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20,
        include: { user: { select: { name: true, email: true } } } }),
    ])

    res.json({ users, docs, reports, sites, openRisks: risks, recentActivity: auditLogs })
  } catch (err) { next(err) }
})

// GET /api/admin/activity
router.get('/activity', async (req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { name: true, email: true, role: true } } },
    })
    res.json({ logs })
  } catch (err) { next(err) }
})

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account.' })
    }
    await prisma.user.delete({ where: { id: req.params.id } })
    res.json({ message: 'User deleted.' })
  } catch (err) { next(err) }
})

module.exports = router
