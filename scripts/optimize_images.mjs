#!/usr/bin/env node
import { existsSync, readdirSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Manual step: losslessly recompress the site's source PNGs with the system
// optipng, in this repository and in the Thruk checkout (docs and themes).
// Run this before building: npm run optimize:images
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const roots = [path.join(root, 'src')]
const source = process.env.THRUK_SOURCE?.trim()
if (!source) {
  console.warn('THRUK_SOURCE is not set, optimizing only this repository')
} else {
  roots.push(path.join(path.resolve(source), 'docs'), path.join(path.resolve(source), 'themes'))
}

// OptiPNG does not recurse into directories, so pass every PNG explicitly.
function pngs (dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name)
    return entry.isDirectory() ? pngs(file) : /\.png$/i.test(entry.name) ? [file] : []
  })
}
const files = roots.flatMap((dir) => (existsSync(dir) ? pngs(dir) : []))
if (!files.length) throw new Error(`No PNGs found in: ${roots.join(', ')}`)

// Run optipng per file so its output shows the current file with sizes
// before and after.
let failed = false
for (const file of files) {
  const before = statSync(file).size
  const result = spawnSync('optipng', ['-o7', file], { encoding: 'utf8' })
  if (result.error) {
    console.warn('optipng not found, skipping PNG optimization (install optipng to use this step)')
    process.exit(0)
  }
  if (result.status !== 0) {
    failed = true
    console.error(`${result.stderr}`.trimEnd())
  } else {
    const after = statSync(file).size
    const saved = before === after ? 'unchanged' : `${((1 - after / before) * 100).toFixed(1)}% smaller`
    console.log(`${file}: ${before} -> ${after} bytes (${saved})`)
  }
}
if (failed) throw new Error('optipng failed for at least one file')
console.log(`Optimized ${files.length} PNGs with optipng -o7`)
