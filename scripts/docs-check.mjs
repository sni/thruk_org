#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parse as parseTemplate } from '@vue/compiler-dom'

function proseLines(text) {
  const lines = []
  let fence
  let length
  text.split('\n').forEach((line, index) => {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line)
    if (fence) {
      if (marker && marker[1][0] === fence && marker[1].length >= length && !marker[2].trim()) fence = null
    } else if (marker) {
      fence = marker[1][0]
      length = marker[1].length
    } else {
      lines.push([line, index + 1])
    }
  })
  return { lines, unclosed: Boolean(fence) }
}

export async function checkDocs(directory, renderer) {
  const root = path.resolve(directory)
  const errors = []
  const files = []
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(file)
      else if (entry.name.endsWith('.md')) files.push(file)
      else if (/\.(asciidoc|adoc|ad)$/.test(entry.name)) errors.push(`old source format: ${path.relative(root, file)}`)
    }
  }
  walk(root)

  // Use the site's renderer so explicit IDs, duplicate headings and reference links agree with VitePress.
  const markdown = renderer || await (await import('vitepress')).createMarkdownRenderer(root)
  const rawFiles = new Map()
  const raw = (file) => rawFiles.has(file) ? rawFiles.get(file) : rawFiles.set(file, fs.readFileSync(file, 'utf8')).get(file)
  const rendered = new Map()
  const render = (file) => {
    if (!rendered.has(file)) {
      const source = raw(file).replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '')
      rendered.set(file, markdown.render(source))
    }
    return rendered.get(file)
  }
  const ids = (html) => new Set([...html.matchAll(/<[a-z][^>]*?\sid=(['"])(.*?)\1/gi)].map((m) => markdown.utils.unescapeAll(m[2])))
  const resolveTarget = (file, url) => {
    if (!url) return file
    const target = url.startsWith('/') ? path.resolve(root, '.' + url) : path.resolve(path.dirname(file), url)
    const candidates = [target]
    if (target.endsWith('.html')) candidates.push(target.slice(0, -5) + '.md')
    if (!path.extname(target)) candidates.push(target + '.md', path.join(target, 'index.md'))
    return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile())
  }

  for (const file of files.sort()) {
    const relative = path.relative(root, file)
    const text = fs.readFileSync(file, 'utf8')
    const { lines, unclosed } = proseLines(text)
    if (unclosed) errors.push(`${relative}: unclosed code fence`)
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
    if (frontmatter && /^(?:layout|breadcrumb|lightbox):/m.test(frontmatter[1])) errors.push(`${relative}: Jekyll front matter`)

    for (const [line, number] of lines) {
      const plain = line.replace(/(`+).*?\1/g, '')
      const where = `${relative}:${number}`
      const container = /^\s*:{3,}\s+(\S+)/.exec(line)
      if (container && !['info', 'tip', 'warning', 'danger', 'details', 'raw', 'v-pre'].includes(container[1])) errors.push(`${where}: unsupported Markdown container ${container[1]}`)
      if (/\{%|%\}|\{\{.*?\}\}/.test(plain)) errors.push(`${where}: Liquid marker outside code`)
      if (/^\s*={1,6}\s+\S|^\s*={2,}\s*$|^\s*\|={3,}/.test(plain)) errors.push(`${where}: AsciiDoc heading or table`)
      if (/\b(?:include::|image::?|link:)[^\s[]+\[/.test(plain)) errors.push(`${where}: AsciiDoc macro`)
      if (/^\s*\+\s*$|^\.(?:[A-Z]|[a-z_][\w/]*[/.]| )/.test(line)) errors.push(`${where}: AsciiDoc caption or list marker`)
      if (/(?<!\]\()https?:\/\/[^\s[\]]+\[[^\]]+\]/.test(plain)) errors.push(`${where}: AsciiDoc URL label`)
      if (/^ {1,3}(?:[\w.]+\s*=|%>|#>|mysql>)/.test(plain)) errors.push(`${where}: unfenced example`)
      const next = lines.find((entry) => entry[1] === number + 1)?.[0]
      if (next?.match(/^#{1,6}\s+/) && line.trim() === next.replace(/^#{1,6}\s+/, '').replace(/\s+\{#[^}]+\}$/, '').trim()) errors.push(`${where}: duplicated heading text`)
    }

    let html
    try {
      html = render(file)
      parseTemplate(html)
      if (!/<h1\b/.test(html)) errors.push(`${relative}: missing H1 heading`)
    } catch (error) {
      const source = error.loc?.source || (error.loc && html?.slice(error.loc.start.offset).match(/^<[^>]+>/)?.[0])
      errors.push(`${relative}: ${error.message}${source ? ` (${source})` : ''}`)
      continue
    }
    for (const match of html.matchAll(/<[a-z][^>]*?\s(?:href|src)=(['"])(.*?)\1/gi)) {
      const raw = markdown.utils.unescapeAll(match[2])
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(raw)) continue
      let url
      let fragment
      try {
        const hash = raw.indexOf('#')
        url = decodeURIComponent((hash < 0 ? raw : raw.slice(0, hash)).split('?')[0])
        fragment = hash < 0 ? '' : decodeURIComponent(raw.slice(hash + 1))
      } catch {
        errors.push(`${relative}: invalid URL ${raw}`)
        continue
      }
      const target = resolveTarget(file, url)
      if (!target) {
        errors.push(`${relative}: missing link target ${raw}`)
        continue
      }
      if (fragment) {
        const targetHtml = target.endsWith('.md') ? render(target) : raw(target)
        if (!ids(targetHtml).has(fragment)) errors.push(`${relative}: missing anchor #${fragment} in ${path.relative(root, target)}`)
      }
    }
  }
  return { errors, count: files.length }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const directory = process.argv[2] || (process.env.THRUK_SOURCE?.trim() && path.resolve(process.env.THRUK_SOURCE, 'docs'))
  if (!directory) throw new Error('THRUK_SOURCE is required. Set it to the Thruk repository root.')
  checkDocs(directory).then(({ errors, count }) => {
    if (errors.length) {
      console.error(errors.join('\n'))
      console.error(`${errors.length} error(s) in ${count} Markdown file(s)`)
      process.exitCode = 1
    } else {
      console.log(`docs check ok: ${count} Markdown file(s)`)
    }
  }).catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
