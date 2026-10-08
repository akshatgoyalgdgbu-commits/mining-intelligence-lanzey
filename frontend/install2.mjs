// Retry install script
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const npmCli = 'C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js'

console.log('Retry npm install...')
const r = spawnSync(
  process.execPath,
  [npmCli, 'install', '--prefer-offline'],
  { cwd: __dirname, stdio: 'inherit', timeout: 300_000 }
)

console.log('Exit status:', r.status)
if (r.error) console.error(r.error)
