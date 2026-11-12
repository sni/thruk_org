#!/usr/bin/env node
// VitePress only watches its own srcDir (.build). Re-stage from THRUK_SOURCE
// whenever a file it reads changes so the dev server reloads it.
import { spawnSync, spawn } from 'node:child_process'
import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// One line per file (name@mtime), so any add, delete or touch changes it.
export function digest(file) {
  const stat = statSync(file, { throwIfNoEntry: false })
  if (!stat) return undefined
  if (stat.isDirectory()) {
    return readdirSync(file, { withFileTypes: true })
      .map((entry) => digest(path.join(file, entry.name)))
      .filter(Boolean)
      .join('\n')
  }
  if (stat.isFile()) return `${file}@${stat.mtimeMs}`
  return undefined
}

const main = () => {
  if (!process.env.THRUK_SOURCE?.trim()) throw new Error('THRUK_SOURCE is required. Set it to the Thruk repository root.')
  const source = path.resolve(process.env.THRUK_SOURCE)
  const themeImages = (theme) => path.join(source, 'themes', 'themes-available', theme, 'images')
  // Everything scripts/build_site.mjs reads from the Thruk checkout. The themes
  // tree is large; only the six logo files matter, so digest those directly.
  const paths = [
    path.join(source, 'docs'),
    path.join(source, 'Changes'),
    ...['Light', 'Dark'].flatMap((theme) => ['logo.svg', 'logo_thruk.png', 'logo_thruk_small_icon.png'].map((name) => path.join(themeImages(theme), name))),
    path.join(themeImages('Light'), 'thruk.svg'),
  ]
  for (const file of paths) {
    if (!digest(file)) throw new Error(`Thruk source incomplete, missing: ${file}`)
  }
  let last = paths.map(digest).join('\0')

  const rescan = () => {
    const current = paths.map(digest).filter(Boolean).join('\0')
    if (current === last) return
    last = current
    console.log('Thruk source changed, re-staging docs')
    const result = spawnSync(process.execPath, ['scripts/build_site.mjs'], { cwd: root, stdio: 'inherit' })
    if (result.status !== 0) console.error('Re-staging failed; the dev server keeps the previous stage')
  }
  setInterval(rescan, 1000).unref?.()

  const dev = spawn('npm', ['run', 'docs:dev:vp'], { cwd: root, stdio: 'inherit' })
  dev.on('exit', (code) => process.exit(code ?? 0))
  process.on('SIGINT', () => dev.kill('SIGINT'))
  process.on('SIGTERM', () => dev.kill('SIGTERM'))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
