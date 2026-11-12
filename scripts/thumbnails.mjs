#!/usr/bin/env node
import { existsSync, readdirSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Manual step: regenerate the gallery thumbnails (<name>-thumb.png, max 512px)
// with the system ImageMagick so pages load small images and the image
// preview dialog opens the full-size original. Run after changing screenshots:
// npm run thumbnails
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const gallery = path.join(root, 'src', 'images', 'galleries')
const MAX_WIDTH = 512

const files = readdirSync(gallery).filter((name) => /\.png$/i.test(name))
if (!files.length) throw new Error(`No gallery PNGs found in ${gallery}`)

let convert = true
let count = 0
for (const name of files) {
  const source = path.join(gallery, name)
  const thumb = path.join(gallery, name.replace(/\.png$/i, '') + '-thumb.png')
  const missing = !existsSync(thumb)
  const stale = !missing && statSync(thumb).mtimeMs < statSync(source).mtimeMs
  if (!missing && !stale) continue
  if (!convert) continue
  // ">" shrinks only, so small sources stay below the thumbnail size and
  // their own file is used directly.
  const result = spawnSync('convert', [source, '-resize', `${MAX_WIDTH}x${MAX_WIDTH}>`, '-strip', thumb], { encoding: 'utf8' })
  if (result.error) {
    convert = false
    console.warn('ImageMagick convert not found, skipping thumbnail generation (install ImageMagick to use this step)')
    break
  }
  if (result.status !== 0) {
    console.error(result.stderr.trimEnd())
    throw new Error(`convert failed for ${name}`)
  }
  count++
  console.log(`${name} -> ${path.basename(thumb)}`)
}
if (!convert) process.exit(0)
console.log(`Generated ${count} gallery thumbnail(s)`)
