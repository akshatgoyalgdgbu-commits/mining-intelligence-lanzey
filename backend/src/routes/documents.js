'use strict'

const express  = require('express')
const multer   = require('multer')
const path     = require('path')
const fs       = require('fs')
const { v4: uuidv4 } = require('uuid')
const { prisma }         = require('../utils/prisma')
const { authenticate }   = require('../middleware/auth')
const { processDocument } = require('../services/ocr')

const router = express.Router()
router.use(authenticate)

// ── Multer setup ──────────────────────────────────────────────────────
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname)
    const name = `${uuidv4()}${ext}`
    cb(null, name)
  },
})

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/tiff',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 50) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`))
    }
  },
})

// ── POST /api/documents/upload ────────────────────────────────────────
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' })

    const { department, siteId } = req.body

    const doc = await prisma.document.create({
      data: {
        filename:     req.file.filename,
        originalName: req.file.originalname,
        mimeType:     req.file.mimetype,
        sizeByes:     req.file.size,
        path:         req.file.path,
        status:       'UPLOADED',
        department:   department || req.user.department,
        siteId:       siteId || null,
        uploadedById: req.user.id,
        processingProgress: 0,
      },
    })

    // Trigger real OCR + field extraction pipeline (async, non-blocking)
    // Use setImmediate so response is sent before pipeline starts
    setImmediate(() => {
      processDocument(doc, prisma).catch(err =>
        console.error('[documents] pipeline error:', err.message)
      )
    })

    res.status(201).json({ document: doc, message: 'Document uploaded. OCR and AI extraction started.' })
  } catch (err) { next(err) }
})

// ── GET /api/documents ────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { department, siteId, status, page = 1, limit = 20 } = req.query
    const where = {}

    // Non-admins see only their department's documents
    if (req.user.role !== 'ADMIN') {
      where.department = req.user.department || req.user.role.toLowerCase()
    }
    if (department) where.department = department
    if (siteId)     where.siteId     = siteId
    if (status)     where.status     = status

    const [total, documents] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: {
          uploadedBy: { select: { name: true } },
          site:       { select: { name: true, code: true } },
        },
      }),
    ])

    res.json({ documents, total, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) { next(err) }
})

// ── GET /api/documents/:id ────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: {
        uploadedBy: { select: { name: true, email: true } },
        site:       { select: { name: true, code: true } },
      },
    })
    if (!doc) return res.status(404).json({ error: 'Document not found.' })
    res.json({ document: doc })
  } catch (err) { next(err) }
})

// ── GET /api/documents/:id/status ─────────────────────────────────────
router.get('/:id/status', async (req, res, next) => {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id },
      select: { id: true, status: true, processingProgress: true, errorMessage: true, updatedAt: true },
    })
    if (!doc) return res.status(404).json({ error: 'Document not found.' })
    res.json(doc)
  } catch (err) { next(err) }
})

// ── DELETE /api/documents/:id ─────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.id } })
    if (!doc) return res.status(404).json({ error: 'Document not found.' })

    // Only uploader or admin can delete
    if (doc.uploadedById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this document.' })
    }

    // Remove file
    if (fs.existsSync(doc.path)) fs.unlinkSync(doc.path)

    await prisma.document.delete({ where: { id: req.params.id } })
    res.json({ message: 'Document deleted.' })
  } catch (err) { next(err) }
})

module.exports = router

