'use strict'

/**
 * Centralized error handler middleware.
 * Returns consistent JSON error structure.
 */
function errorHandler(err, req, res, next) {
  // Prisma: record not found
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found.' })
  }

  // Prisma: unique constraint violation
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Duplicate entry — a record with this value already exists.',
      field: err.meta?.target,
    })
  }

  // Prisma: cannot reach database
  if (err.constructor?.name === 'PrismaClientInitializationError' ||
      err.message?.includes("Can't reach database") ||
      err.message?.includes('P1001')) {
    return res.status(503).json({
      error: 'Database unavailable. Please ensure PostgreSQL is running on port 5432.',
      hint:  'Run: pg_ctl start  (or start your PostgreSQL service)',
    })
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token.' })
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired.' })
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large.' })
  }

  // Validation errors
  if (err.type === 'validation') {
    return res.status(400).json({ error: err.message, details: err.details })
  }

  // Default
  const status  = err.status || err.statusCode || 500
  const message = err.message || 'Internal server error'

  if (process.env.NODE_ENV === 'development') {
    console.error('[ERROR]', err.message || err)
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

module.exports = { errorHandler }
