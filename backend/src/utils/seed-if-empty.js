'use strict'

// Avoid adding duplicate demo rows whenever a sleeping free service restarts.
const { spawnSync } = require('node:child_process')
const path = require('node:path')
const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  let userCount
  try {
    userCount = await prisma.user.count()
  } finally {
    await prisma.$disconnect()
  }

  if (userCount > 0) return

  const result = spawnSync(process.execPath, [path.join(__dirname, 'seed.js')], {
    stdio: 'inherit',
    env: process.env,
  })
  if (result.error) throw result.error
  if (result.status !== 0) process.exitCode = result.status || 1
}

main().catch(error => {
  console.error('Seed initialization failed:', error.message)
  process.exitCode = 1
})
