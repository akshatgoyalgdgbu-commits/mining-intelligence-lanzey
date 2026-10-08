'use strict'

const { spawnSync } = require('node:child_process')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const backend = path.join(root, 'backend')
const frontend = path.join(root, 'frontend')

function run(command, args, cwd, env = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status || 1)
}

if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 16) {
  throw new Error('Set ADMIN_PASSWORD in the Vercel project environment (16+ characters).')
}

run('npx', ['prisma', 'generate'], backend)
run('npx', ['prisma', 'db', 'push'], backend, {
  DATABASE_URL: 'file:./vercel-demo.db',
})
run(process.execPath, [path.join(backend, 'src/utils/seed-if-empty.js')], backend, {
  DATABASE_URL: 'file:./vercel-demo.db',
  NODE_ENV: 'production',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'demo.admin@lanzey.local',
})
run('npm', ['run', 'build'], frontend, { VITE_API_URL: '/api' })

