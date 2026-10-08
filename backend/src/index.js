'use strict'
require('dotenv').config()

const express     = require('express')
const helmet      = require('helmet')
const cors        = require('cors')
const morgan      = require('morgan')
const path        = require('path')
const rateLimit   = require('express-rate-limit')

const { errorHandler } = require('./middleware/errorHandler')

// Routes
const knowledgeRoutes    = require('./routes/knowledge')
const validateRoutes     = require('./routes/validate')
const hitlRoutes         = require('./routes/hitl')
const authRoutes         = require('./routes/auth')
const documentsRoutes    = require('./routes/documents')
const productionRoutes   = require('./routes/production')
const geologyRoutes      = require('./routes/geology')
const machineryRoutes    = require('./routes/machinery')
const environmentRoutes  = require('./routes/environment')
const reserveRoutes      = require('./routes/reserve')
const reportsRoutes      = require('./routes/reports')
const queryRoutes        = require('./routes/query')
const adminRoutes        = require('./routes/admin')
const riskRoutes         = require('./routes/risk')
const sitesRoutes        = require('./routes/sites')

const app  = express()
const PORT = process.env.PORT || 4000

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production.')
}

// ── Security ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

// ── CORS (allow localhost + deployed frontend) ─────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ── Rate limiting ─────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 200 : 100000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: () => process.env.NODE_ENV !== 'production',
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 100000,
  message: { error: 'Too many auth attempts, please try again later.' },
  skip: () => process.env.NODE_ENV !== 'production',
})

app.use('/api/', generalLimiter)
app.use('/api/auth/', authLimiter)

// ── Body parsing ──────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ── Logging ───────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

// ── Static file serving (uploads) ────────────────────────────────────
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || './uploads')))

// ── Health check ──────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'LANZEY API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

// ── API Routes ────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes)
app.use('/api/documents',   documentsRoutes)
app.use('/api/production',  productionRoutes)
app.use('/api/geology',     geologyRoutes)
app.use('/api/machinery',   machineryRoutes)
app.use('/api/environment', environmentRoutes)
app.use('/api/reserve',     reserveRoutes)
app.use('/api/reports',     reportsRoutes)
app.use('/api/query',       queryRoutes)
app.use('/api/admin',       adminRoutes)
app.use('/api/risk',        riskRoutes)
app.use('/api/sites',       sitesRoutes)
app.use('/api/knowledge',   knowledgeRoutes)
app.use('/api/validate',    validateRoutes)
app.use('/api/hitl',        hitlRoutes)

// In production the Express service also serves the Vite build, so the app
// and API share one origin and the frontend can use the relative /api base.
const frontendDist = path.resolve(__dirname, '../../frontend/dist')
app.use(express.static(frontendDist))
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next()
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) next(err)
  })
})

// ── 404 ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
})

// ── Error handler ─────────────────────────────────────────────────────
app.use(errorHandler)

// ── Start ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🟢 LANZEY API running on http://localhost:${PORT}`)
  console.log(`   Environment : ${process.env.NODE_ENV}`)
  console.log(`   DB          : ${(process.env.DATABASE_URL || '').replace(/:([^@]+)@/, ':***@')}`)
  console.log(`   Health      : http://localhost:${PORT}/api/health\n`)
})

module.exports = app
