import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMarkdownRenderer } from 'vitepress'

export async function checkLinks(directory) {
  const root = path.resolve(directory)
  const errors = new Set()
  const pages = []
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(file)
      else if (entry.name.endsWith('.html')) pages.push(file)
    }
  }
  walk(root)
  const markdown = await createMarkdownRenderer(root)
  const decode = markdown.utils.unescapeAll
  const anchors = new Map()
  function ids(file) {
    if (!anchors.has(file)) {
      const html = readFileSync(file, 'utf8')
      anchors.set(file, new Set([...html.matchAll(/<[a-z][^>]*?\s(?:id|name)=(['"])(.*?)\1/gi)].map((match) => decode(match[2]))))
    }
    return anchors.get(file)
  }

  for (const file of pages) {
    const relative = path.relative(root, file).split(path.sep).join('/')
    const html = readFileSync(file, 'utf8')
    for (const match of html.matchAll(/<[a-z][^>]*?\s(?:href|src)=(['"])(.*?)\1/gi)) {
      const raw = decode(match[2])
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(raw)) continue
      let target
      let fragment
      try {
        // URL resolution matches browser handling of native ../ links.
        const url = new URL(raw, 'https://local.invalid/' + relative)
        target = path.resolve(root, '.' + decodeURIComponent(url.pathname))
        if (target !== root && !target.startsWith(root + path.sep)) throw new Error('URL leaves the site root')
        fragment = decodeURIComponent(url.hash.slice(1))
      } catch {
        errors.add(`${relative}: invalid URL ${raw}`)
        continue
      }
      if (existsSync(target) && statSync(target).isDirectory()) target = path.join(target, 'index.html')
      if (!existsSync(target) || !statSync(target).isFile()) {
        errors.add(`${relative}: missing target ${raw}`)
      } else if (fragment && /\.(html|svg)$/.test(target) && !ids(target).has(fragment)) {
        errors.add(`${relative}: missing anchor ${raw}`)
      }
    }
  }
  return { pages: pages.length, errors: [...errors] }
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  const root = process.argv[2] || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.vitepress', 'dist')
  checkLinks(root).then(({ pages, errors }) => {
    if (errors.length) {
      console.error(errors.join('\n'))
      console.error(`${errors.length} broken local links or anchors in ${pages} HTML pages`)
      process.exitCode = 1
    } else {
      console.log(`Checked ${pages} HTML pages: 0 broken local links or anchors`)
    }
  }).catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
