import { assert, test } from 'vitest'
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import path from 'node:path'

const DIST_DIR = path.join(__dirname, '../.vitepress/dist')

// Check loaded legacy assets, not words or code examples that discuss them.
const FORBIDDEN_PATTERN = [
  /<(?:script|link)\b[^>]*(?:src|href)=["'][^"']*(?:jekyll|asciidoctor|bootstrap\.3\.4\.1)/i,
  /\{%\s*(?:include|capture|gallery)\b/,
]

function walk (dir) {
  if (!existsSync(dir)) {
    return []
  }
  const files = readdirSync(dir)
  return files.flatMap((file) => {
    const fullPath = path.join(dir, file)
    return statSync(fullPath).isDirectory() ? walk(fullPath) : [fullPath]
  })
}

// The pages that must exist in the built site.
const REQUIRED_PAGES = [
  'index.html',
  'documentation/index.html',
  'documentation/install.html',
  'documentation/configuration.html',
  'documentation/faq.html',
  'guides/first-steps.html',
  'guides/architecture.html',
  'guides/access-control.html',
  'guides/operations.html',
  'guides/troubleshooting.html',
  'development/README.html',
  'development/logo.html',
  'README.html',
  'whatsnew/index.html',
  'whatsnew/v3.30.html',
  'changelog.html',
  'download.html',
  'screenshots.html',
  'benchmark.html',
  'demo.html',
  'naglint.html',
  'easy.html',
  'open.html',
  'support.html',
  'donate.html',
  'impressum.html',
  'news/index.html',
  // authored 404 page (VitePress serves it for unknown routes)
  '404.html',
  // legacy redirect paths that the old site served
  'faq.html',
  'documentation.html',
  'whatsnew.html',
  // images
  'images/galleries/01_main.png',
  'favicon.ico',
  'favicon-light.png',
  'favicon-dark.png',
  'images/logo-light.svg',
  'images/logo-dark.svg'
]

for (const word of FORBIDDEN_PATTERN) {
  test(`rendered files should not contain "${word}"`, () => {
    if (!existsSync(DIST_DIR)) {
      assert.fail(`dist dir missing, run the build first: ${DIST_DIR}`)
    }
    const htmlFiles = walk(DIST_DIR).filter((f) => f.endsWith('.html'))
    for (const file of htmlFiles) {
      const content = readFileSync(file, 'utf8').replace(/<pre\b[\s\S]*?<\/pre>|<code\b[\s\S]*?<\/code>/gi, '')
      if (word.test(content)) {
        assert.fail(`File ${path.relative(DIST_DIR, file)} contains forbidden pattern: "${word}"`)
      }
    }
  })
}

for (const page of REQUIRED_PAGES) {
  test(`built site contains ${page}`, () => {
    assert.ok(existsSync(path.join(DIST_DIR, page)), `missing ${page} in the built site`)
  })
}

test('changelog has a v3.30 anchor', () => {
  const content = readFileSync(path.join(DIST_DIR, 'changelog.html'), 'utf8')
  assert.ok(content.includes('id="v3-30"'), 'changelog v3.30 anchor missing')
  assert.notInclude(content, 'This file documents the revision')
  assert.match(content, /<h2 id="v3-30"[^>]*>v3\.30 <time class="release-date ignore-header" datetime="2026-10-22">2026-10-22<\/time>/)
  assert.include(content, 'href="/whatsnew/v3.30.html"')
})

test('release highlights index groups all release links into cards, newest first', () => {
  const content = readFileSync(path.join(DIST_DIR, 'whatsnew/index.html'), 'utf8')
  const cards = content.match(/<div class="release-highlights">([\s\S]*?)<\/div>/)?.[1]
  assert.ok(cards, 'release cards missing')
  const links = [...cards.matchAll(/href="(\/whatsnew\/v[\d.]+\.html)"/g)].map((match) => match[1])
  const versions = readdirSync(path.join(__dirname, '../src/whatsnew')).filter((name) => /^v[\d.]+\.md$/.test(name))
  assert.lengthOf(links, versions.length)
  assert.equal(links[0], '/whatsnew/v3.30.html')
  assert.equal(links.at(-1), '/whatsnew/v2.28.html')
})

test('top dropdown labels link to their first menu item', () => {
  const content = readFileSync(path.join(DIST_DIR, 'index.html'), 'utf8')
  const navigation = content.match(/<nav[^>]*class="[^"]*VPNavBarMenu[^"]*"[\s\S]*?<\/nav>/)?.[0]
  assert.ok(navigation)
  const labels = [...navigation.matchAll(/<summary[^>]*>\s*<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)]
  for (const [text, link] of [
    ['Downloads', '/download.html'], ['Documentation', '/documentation/index.html'],
    ['Guides', '/guides/first-steps.html'], ['Development', '/development/README.html'], ['Services', '/support.html'],
  ]) {
    assert.ok(labels.some((label) => label[1] === link && label[2] === text), text)
  }
  assert.lengthOf([...navigation.matchAll(/<details/g)], 5)
})

test('screenshots keep fallback links and include a closable image dialog', () => {
  const content = readFileSync(path.join(DIST_DIR, 'screenshots.html'), 'utf8')
  assert.match(content, /<a href="\/images\/galleries\/01_main.png"><img/)
  assert.match(content, /<dialog[^>]*aria-label="Image preview"/)
  assert.include(content, 'method="dialog"')
  assert.include(content, 'aria-label="Close image preview"')
})

test('release plan has Stable, Nightly and Next columns in a colourable Markdown table', () => {
  const tables = ['download.html', 'index.html'].map((page) => {
    const content = readFileSync(path.join(DIST_DIR, page), 'utf8')
    const table = content.match(/<div class="release-plan">\s*(<table[\s\S]*?<\/table>)/)?.[1]
    assert.ok(table, `${page}: release-plan table missing`)
    const headings = [...table.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)].map((match) => match[1].replace(/<[^>]+>/g, ''))
    assert.deepEqual(headings, ['Stable', 'Nightly', 'Next'])
    return table
  })
  assert.equal(tables[0], tables[1])
})

test('version hints render as coloured badges', () => {
  for (const page of ['teams', 'custom-quick-actions', 'configuration']) {
    const content = readFileSync(path.join(DIST_DIR, `documentation/${page}.html`), 'utf8')
    const badges = [...content.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<span class="VPBadge tip">(New in Thruk [^<]+)<\/span>/g)]
    assert.isAbove(badges.length, 0)
    for (const badge of badges) assert.notMatch(badge[1], /\.$/)
    assert.notMatch(content, /\(New in Thruk [^)]+\)/)
  }
})

test('deprecation hints render as warning badges and keep links and code formatting', () => {
  const content = readFileSync(path.join(DIST_DIR, 'documentation/configuration.html'), 'utf8').replace(/<!--[\s\S]*?-->/g, '')
  assert.include(content, '<span class="VPBadge warning">DEPRECATED: setting this has no effect with Thruk 2.34 or later</span>')
  assert.include(content, '<span class="VPBadge warning">DEPRECATED: use <code>server_timezone</code> now</span>')
  assert.match(content, /<span class="VPBadge warning">DEPRECATED: please use <a href="[^\"]*lmd.html">LMD<\/a> when using multiple backends<\/span>/)
})

test('release pages show breadcrumbs, themed logos and readable changelogs without feed links', () => {
  const content = readFileSync(path.join(DIST_DIR, 'whatsnew/v3.30.html'), 'utf8')
  assert.include(content, 'aria-label="Breadcrumb"')
  assert.match(content, /href="\/whatsnew\/index.html"[^>]*>Release highlights/)
  assert.include(content, 'aria-current="page"')
  assert.include(content, '/images/logo-light.svg')
  assert.include(content, '/images/logo-dark.svg')
  assert.include(content, '/favicon-light.png')
  assert.include(content, '<li>fix remote code vulnerability')
  assert.notInclude(content, '/news/feed.xml')
})

test('legacy favicon embeds the new theme icon', () => {
  const ico = readFileSync(path.join(DIST_DIR, 'favicon.ico'))
  const png = readFileSync(path.join(DIST_DIR, 'favicon-light.png'))
  assert.equal(ico.readUInt16LE(2), 1)
  assert.equal(ico.readUInt16LE(4), 1)
  assert.equal(ico.readUInt32LE(14), png.length)
  assert.equal(ico.readUInt32LE(18), 22)
  assert.deepEqual(ico.subarray(22), png)
})

// The site ships its own 404 page (authored in src/pages/404.md). VitePress
// copies it to dist/404.html, so a static server shows it for unknown routes
// instead of the bare default.
test('404 page is present and is the authored page', () => {
  const content = readFileSync(path.join(DIST_DIR, '404.html'), 'utf8')
  assert.ok(content.includes('File Not Found'), '404.html is not the authored page')
})
