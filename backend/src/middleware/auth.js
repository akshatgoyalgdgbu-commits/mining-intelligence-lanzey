'use strict'

const jwt = require('jsonwebtoken')
const { prisma } = require('../utils/prisma')

/**
 * Verifies JWT and attaches req.user.
 * Returns 401 if token missing/invalid, 403 if user deactivated.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required.' })
    }

    const token   = authHeader.slice(7)
    const payload = jwt.verify(token, process.env.JWT_SECRET)

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true, department: true, active: true },
    })

    if (!user)         return res.status(401).json({ error: 'User not found.' })
    if (!user.active)  return res.status(403).json({ error: 'Account deactivated.' })

    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}

/**
 * Restricts access to specific roles.
 * Usage: authorize('ADMIN', 'CIL')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
      })
    }
    next()
  }
}

module.exports = { authenticate, authorize }
