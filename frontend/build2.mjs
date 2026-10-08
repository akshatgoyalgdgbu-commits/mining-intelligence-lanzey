import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const npmCli = 'C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js'

function run(label, args) {
  console.log(`\n── ${label} ──`)
  const r = spawnSync(process.execPath, args, {
    cwd: __dirname, stdio: 'inherit', timeout: 240_000
  })
  if (r.status !== 0) {
    console.error(`${label} failed (status ${r.status})`)
    process.exit(r.status ?? 1)
  }
  console.log(`✓ ${label}`)
}

run('npm install (add lucide-react)', [npmCli, 'install', '--prefer-offline'])
run('TypeScript check', ['node_modules/typescript/bin/tsc', '--noEmit'])
run('Vite build', ['node_modules/vite/bin/vite.js', 'build'])
