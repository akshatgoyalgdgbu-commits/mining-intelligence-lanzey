// Bootstrap script — run with: node install.mjs
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'
import { existsSync } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const npmCli = 'C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js'

if (!existsSync(npmCli)) {
  console.error('npm-cli.js not found at expected path:', npmCli)
  process.exit(1)
}

console.log('Installing dependencies...')
const install = spawnSync(
  process.execPath,
  [npmCli, 'install'],
  { cwd: __dirname, stdio: 'inherit', timeout: 300_000 }
)

if (install.status !== 0) {
  console.error('npm install failed with status:', install.status)
  process.exit(install.status ?? 1)
}

console.log('\nRunning type-check...')
const tsc = spawnSync(
  process.execPath,
  ['node_modules/.bin/tsc', '--noEmit'],
  { cwd: __dirname, stdio: 'inherit', timeout: 60_000 }
)

if (tsc.status !== 0) {
  console.error('Type-check failed. See errors above.')
  process.exit(tsc.status ?? 1)
}

console.log('\nRunning build...')
const build = spawnSync(
  process.execPath,
  ['node_modules/.bin/vite', 'build'],
  { cwd: __dirname, stdio: 'inherit', timeout: 120_000 }
)

if (build.status !== 0) {
  console.error('Build failed. See errors above.')
  process.exit(build.status ?? 1)
}

console.log('\n✓ LANZEY build complete.')
