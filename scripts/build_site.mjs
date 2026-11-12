#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderChanges, renderReleaseNotes } from './changes.mjs'
import { checkDocs } from './docs-check.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
if (!process.env.THRUK_SOURCE?.trim()) throw new Error('THRUK_SOURCE is required. Set it to the Thruk repository root.')
const source = path.resolve(process.env.THRUK_SOURCE)
const docs = path.join(source, 'docs')
if (!existsSync(docs)) throw new Error(`Documentation directory not found: ${docs}. Set THRUK_SOURCE to the Thruk checkout.`)

// Use this site's installed renderer, including when the docs checkout has no node_modules.
const { createMarkdownRenderer } = await import('vitepress')
const checked = await checkDocs(docs, await createMarkdownRenderer(docs))
if (checked.errors.length) throw new Error(`Documentation validation failed:\n${checked.errors.join('\n')}`)
console.log(`Validated ${checked.count} canonical Markdown pages`)

const stage = path.join(root, '.build')
const publicDir = path.join(stage, 'public')
rmSync(stage, { recursive: true, force: true })
mkdirSync(publicDir, { recursive: true })

const read = (file) => readFileSync(file, 'utf8')
const write = (file, content) => {
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, content)
}
function copyTree(from, to, filter) {
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name)
    const dest = path.join(to, entry.name)
    if (entry.isDirectory()) copyTree(src, dest, filter)
    else if (!filter || filter(src)) {
      mkdirSync(path.dirname(dest), { recursive: true })
      cpSync(src, dest)
    }
  }
}

const metadata = Object.fromEntries(read(path.join(root, '.env')).split('\n')
  .filter((line) => line.includes('=') && !line.startsWith('#'))
  .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1).trim()]))
for (const key of ['VITE_RELEASE_VERSION', 'VITE_RELEASE_DATE', 'VITE_NEXT_RELEASE_DATE']) {
  if (!metadata[key]) throw new Error(`Missing release metadata: ${key}`)
}

copyTree(path.join(root, 'src', 'images'), path.join(publicDir, 'images'))
cpSync(path.join(source, 'themes', 'themes-available', 'Light', 'images', 'thruk.svg'), path.join(publicDir, 'images', 'thruk.svg'))
for (const theme of ['Light', 'Dark']) {
  const images = path.join(source, 'themes', 'themes-available', theme, 'images')
  cpSync(path.join(images, 'logo.svg'), path.join(publicDir, 'images', `logo-${theme.toLowerCase()}.svg`))
  cpSync(path.join(images, 'logo_thruk.png'), path.join(publicDir, 'images', `logo-${theme.toLowerCase()}.png`))
  cpSync(path.join(images, 'logo_thruk_small_icon.png'), path.join(publicDir, 'images', `thruk-${theme.toLowerCase()}.png`))
  cpSync(path.join(images, 'logo_thruk_small_icon.png'), path.join(publicDir, `favicon-${theme.toLowerCase()}.png`))
}
// ICO supports an embedded PNG; keep the legacy favicon URL on the new branding too.
const icon = readFileSync(path.join(publicDir, 'favicon-light.png'))
const iconHeader = Buffer.from([0, 0, 1, 0, 1, 0, 50, 50, 0, 0, 1, 0, 32, 0, 0, 0, 0, 0, 22, 0, 0, 0])
iconHeader.writeUInt32LE(icon.length, 14)
writeFileSync(path.join(publicDir, 'favicon.ico'), Buffer.concat([iconHeader, icon]))
for (const section of ['documentation', 'guides', 'development']) {
  copyTree(path.join(docs, section), path.join(stage, section))
  // An image can also be a download link. Keep its original URL as well as VitePress's hashed asset.
  copyTree(path.join(docs, section), path.join(publicDir, section), (file) => /\.(png|jpe?g|gif|svg|ico|webp)$/i.test(file))
}
cpSync(path.join(docs, 'README.md'), path.join(stage, 'README.md'))

// Copy Markdown verbatim. In particular, do not rewrite links inside code examples.
for (const name of readdirSync(path.join(root, 'src', 'pages')).filter((file) => file.endsWith('.md'))) {
  const target = { 'news-index.md': 'news/index.md', 'logo.md': 'development/logo.md' }[name] || name
  const text = read(path.join(root, 'src', 'pages', name)).replace(/\{\{(VITE_[A-Z_]+)\}\}/g, (_, key) => {
    if (!metadata[key]) throw new Error(`Unknown release metadata: ${key}`)
    return metadata[key]
  })
  write(path.join(stage, target), text)
}

for (const name of readdirSync(path.join(root, 'src', 'whatsnew')).filter((file) => file.endsWith('.md'))) {
  write(path.join(stage, 'whatsnew', name), renderReleaseNotes(read(path.join(root, 'src', 'whatsnew', name))))
}
for (const entry of readdirSync(path.join(root, 'src', 'whatsnew'), { withFileTypes: true })) {
  if (entry.isDirectory()) copyTree(path.join(root, 'src', 'whatsnew', entry.name), path.join(publicDir, 'whatsnew', entry.name))
}
const versions = readdirSync(path.join(root, 'src', 'whatsnew')).filter((name) => /^v[\d.]+\.md$/.test(name))
  .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
if (!versions.length) throw new Error('No native Markdown release pages found in src/whatsnew')
write(path.join(stage, 'whatsnew', 'index.md'), '# Release highlights\n\nRead the highlights for each release, or see the [full changelog](/changelog.html) for all changes.\n\n<div class="release-highlights">\n\n' + versions
  .map((file) => `- [${file.slice(0, -3)}](/whatsnew/${file.slice(0, -3)}.html)`).join('\n') + '\n\n</div>\n')
cpSync(path.join(root, 'src', 'screenshots', 'index.md'), path.join(stage, 'screenshots.md'))
cpSync(path.join(root, 'src', 'benchmark.md'), path.join(stage, 'benchmark.md'))
write(path.join(stage, 'changelog.md'), renderChanges(read(path.join(source, 'Changes')), versions.map((file) => file.slice(1, -3))))

for (const [file, target] of Object.entries({
  'faq.html': '/documentation/faq.html',
  'documentation.html': '/documentation/index.html',
  'whatsnew.html': '/whatsnew/index.html',
  'screenshots/index.html': '/screenshots.html',
})) {
  write(path.join(publicDir, file), `<!DOCTYPE html>\n<html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${target}"><title>Thruk page moved</title></head><body><a href="${target}">Continue to the Thruk page</a></body></html>\n`)
}
console.log(`Staged canonical docs, authored pages, ${versions.length} release summaries and static API pages`)
