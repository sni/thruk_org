#!/usr/bin/env node
import { existsSync, readdirSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Manual step: regenerate the gallery thumbnails (<name>-thumb.png, max 512px)
// with the system ImageMagick so pages load small images and the image
// preview dialog opens the full-size original, then compress each generated
// thumbnail with optipng in the same run. Run after changing screenshots:
// npm run thumbnails
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const gallery = path.join(root, 'src', 'images', 'galleries')
const MAX_WIDTH = 512

// Skip the generated thumbnails themselves.
const files = readdirSync(gallery).filter((name) => /\.png$/i.test(name) && !/-thumb\.png$/i.test(name))
if (!files.length) throw new Error(`No gallery PNGs found in ${gallery}`)

let convert = true
let optimize = true
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
  if (optimize) {
    const optimizeResult = spawnSync('optipng', ['-o7', thumb], { encoding: 'utf8' })
    if (optimizeResult.error) {
      optimize = false
      console.warn('optipng not found, skipping thumbnail optimization (install optipng to use this step)')
    } else if (optimizeResult.status !== 0) {
      console.error(optimizeResult.stderr.trimEnd())
      throw new Error(`optipng failed for ${name}`)
    }
  }
  count++
  console.log(`${name} -> ${path.basename(thumb)} (${statSync(thumb).size} bytes)`)
}
if (!convert) process.exit(0)
console.log(`Generated ${count} gallery thumbnail(s)`)
