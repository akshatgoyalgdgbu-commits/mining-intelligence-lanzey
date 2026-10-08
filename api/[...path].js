'use strict'

const fs = require('node:fs')
const path = require('node:path')

// Vercel functions have an ephemeral, writable /tmp directory. Seed each
// instance from the demo database prepared during the build, then point Prisma
// at that writable copy. Changes made to one instance are not durable/shared.
const databasePath = '/tmp/lanzey-demo.db'
if (!fs.existsSync(databasePath)) {
  const bundledDatabase = path.resolve(__dirname, '../backend/prisma/vercel-demo.db')
  fs.copyFileSync(bundledDatabase, databasePath)
}

process.env.DATABASE_URL = `file:${databasePath}`
process.env.UPLOAD_DIR = process.env.UPLOAD_DIR || '/tmp/lanzey-uploads'
fs.mkdirSync(process.env.UPLOAD_DIR, { recursive: true })

module.exports = require('../backend/src/index')

