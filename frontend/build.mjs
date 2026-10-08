import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function run(label, args) {
  console.log(`\n── ${label} ──`)
  const r = spawnSync(
    process.execPath,
    args,
    { cwd: __dirname, stdio: 'inherit', timeout: 120_000 }
  )
  if (r.status !== 0) {
    console.error(`${label} failed (status ${r.status})`)
    if (r.error) console.error(r.error.message)
    process.exit(r.status ?? 1)
  }
  console.log(`✓ ${label} passed`)
}

run('TypeScript check', ['node_modules/typescript/bin/tsc', '--noEmit'])
run('Vite build',       ['node_modules/vite/bin/vite.js', 'build'])
