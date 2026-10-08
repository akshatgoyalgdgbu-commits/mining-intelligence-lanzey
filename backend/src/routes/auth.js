'use strict'

const express  = require('express')
const bcrypt   = require('bcryptjs')
const { body, validationResult } = require('express-validator')
const { prisma }      = require('../utils/prisma')
const { signToken }   = require('../utils/jwt')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()

// ── POST /api/auth/login ──────────────────────────────────────────────
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input', details: errors.array() })
    }

    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const token = signToken(user.id, user.role)

    // Audit log
    await prisma.auditLog.create({
      data: { userId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id },
    }).catch(() => {})

    res.json({
      token,
      user: {
        id:         user.id,
        email:      user.email,
        name:       user.name,
        role:       user.role,
        department: user.department,
      },
    })
  } catch (err) {
    next(err)
  }
})

// ── GET /api/auth/me ──────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user })
})

// ── POST /api/auth/logout ─────────────────────────────────────────────
router.post('/logout', authenticate, async (req, res) => {
  await prisma.auditLog.create({
    data: { userId: req.user.id, action: 'LOGOUT', entity: 'User', entityId: req.user.id },
  }).catch(() => {})
  res.json({ message: 'Logged out successfully.' })
})

// ── POST /api/auth/register (ADMIN only) ──────────────────────────────
router.post('/register', authenticate, authorize('ADMIN'), [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().isLength({ min: 2 }),
  body('role').isIn(['ADMIN','CIL','CMPDI','GEOLOGICAL','ENVIRONMENT','MACHINERY','RESERVE_CHECKER']),
], async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() })
    }

    const { email, password, name, role, department } = req.body

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, passwordHash, name, role, department },
      select: { id: true, email: true, name: true, role: true, department: true },
    })

    const token = signToken(user.id, user.role)
    res.status(201).json({ token, user })
  } catch (err) {
    next(err)
  }
})

module.exports = router
