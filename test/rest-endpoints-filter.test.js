import { test } from 'vitest'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { collectSections, applyFilter, matchQuery, outlineVisible } from '../.vitepress/theme/rest-filter.mjs'

// Minimal fake DOM: h3 headings are siblings, each followed by body nodes up
// to the next h3. A node is a "table" when it carries `isTable`.
function makeDoc(sections) {
  // sections: [{ title, body, table }]
  const nodes = []
  const headings = []
  sections.forEach((section, i) => {
    const heading = { tagName: 'H3', id: section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), textContent: section.title, nextElementSibling: null }
    headings.push(heading)
    nodes.push(heading)
    if (section.body) {
      const body = { tagName: 'P', textContent: section.body, nextElementSibling: null, hidden: false }
      nodes.push(body)
    }
    if (section.table) {
      const table = { tagName: 'TABLE', isTable: true, textContent: section.table, nextElementSibling: null, hidden: false }
      nodes.push(table)
    }
  })
  nodes.forEach((node, i) => { node.nextElementSibling = nodes[i + 1] || null })
  return { headings, nodes }
}

test('collectSections groups each endpoint from its h3 to the next h3 and captures the id', () => {
  const { headings } = makeDoc([
    { title: 'GET /hosts', body: 'lists hosts' },
    { title: 'POST /thruk/users/<id>/cmd/lock', body: 'locks a user' },
    { title: 'GET /thruk/panorama', body: 'lists dashboards' },
  ])
  const sections = collectSections({ querySelectorAll: () => headings })
  assert.equal(sections.length, 3)
  assert.equal(sections[0].id, 'get-hosts', 'heading id is captured for jump links')
  assert.equal(sections[0].nodes.length, 2, 'a section is heading + body, stops at next h3')
})

test('attribute tables are excluded from the match text so column names do not leak', () => {
  const { headings } = makeDoc([
    { title: 'POST /thruk/users/<id>/cmd/lock', body: 'locks a user' },
    { title: 'GET /thruk/stats', body: 'lists statistics', table: 'users_locked_total | number | total locked users' },
    { title: 'GET /thruk/logcache/stats', body: 'lists logcache statistics', table: 'mode | string | current lock mode' },
  ])
  const sections = collectSections({ querySelectorAll: () => headings })
  // "lock" must match the real lock command but NOT the two tables that merely
  // contain "locked" / "lock mode"
  const { visible } = applyFilter(sections, 'lock')
  assert.deepEqual(visible, [true, false, false], 'tables do not drive matches')
})

test('applyFilter is a case-insensitive substring match and empty shows all', () => {
  const { headings } = makeDoc([
    { title: 'GET /hosts', body: 'lists hosts' },
    { title: 'POST /thruk/users/<id>/cmd/lock', body: 'locks a user' },
    { title: 'GET /thruk/panorama', body: 'lists dashboards' },
  ])
  const sections = collectSections({ querySelectorAll: () => headings })

  assert.deepEqual(applyFilter(sections, '').visible, [true, true, true], 'empty query shows everything')
  assert.equal(applyFilter(sections, '').shown, 3)

  const lock = applyFilter(sections, 'LOCK')
  assert.deepEqual(lock.visible, [false, true, false], 'upper-case query still matches')
  assert.equal(lock.shown, 1)

  const none = applyFilter(sections, 'no-such-thing')
  assert.deepEqual(none.visible, [false, false, false], 'no match hides everything')
  assert.equal(none.shown, 0)

  const hosts = applyFilter(sections, ' hosts ')
  assert.deepEqual(hosts.visible, [true, false, false], 'trims surrounding whitespace')
})

test('matchQuery splits on whitespace and requires all chunks to match', () => {
  const text = 'get /hosts/<name>/config fetches the host configuration'
  assert.equal(matchQuery(text, 'GET /config'), true, 'single chunk still works')
  assert.equal(matchQuery(text, 'GET config'), true, 'whitespace between chunks')
  assert.equal(matchQuery(text, 'GET PATCH'), false, 'all chunks must match')
  assert.equal(matchQuery(text, ''), true, 'empty query matches')
})

test('matchQuery treats chunks as case-insensitive regular expressions, with a literal fallback', () => {
  const text = 'get /hosts/<name>/config'
  assert.equal(matchQuery(text, '/hostS'), true, 'alternation and case-insensitivity')
  assert.equal(matchQuery(text, '/(hostS|services)/'), true, 'groups')
  assert.equal(matchQuery('get /hosts/availability', 'config|availability'), true, 'alternation stays inside one chunk')
  assert.equal(matchQuery(text, 'hosts/<name>'), true, 'unmatched < > are literal when the regex is invalid')
})

test('outlineVisible keeps a branch when it targets a match and collapses others', () => {
  const visible = new Set(['get-contacts', 'post-contactsnamecmd'])
  assert.equal(outlineVisible(['get-contacts'], visible, 'contact'), true, 'a matching entry stays')
  assert.equal(outlineVisible(['get-logs'], visible, 'contact'), false, 'a non-matching entry collapses')
  assert.equal(outlineVisible(['group', 'post-contactsnamecmd'], visible, 'contact'), true, 'a nested match keeps the parent branch')
  assert.equal(outlineVisible(['a', 'b'], visible, ''), true, 'empty query keeps everything')
})

test('the Vue component drives the filter and filters the page navigation outline', () => {
  const vue = readFileSync(new URL('../.vitepress/theme/RestEndpointsFilter.vue', import.meta.url), 'utf8')
  assert.match(vue, /import \{ collectSections, applyFilter, outlineVisible \} from '\.\/rest-filter\.mjs'/, 'uses the filter module')
  assert.match(vue, /class="rest-endpoints-filter"/, 'root class for styling')
  assert.match(vue, /type="search"/, 'has a search input')
  assert.match(vue, /rest-endpoints-count/, 'has the result counter element')
  assert.match(vue, /\.VPDocAsideOutline a\[href\^="#"\]/, 'filters the right-side page navigation outline')
  assert.match(vue, /node\.style\.display = /, 'hides with inline style so VitePress display rules cannot override')
  assert.match(vue, /aria-label="Clear filter"/, 'has a clear button like the site search field')
  assert.match(vue, /class="rest-endpoints-clear"/, 'clear button styling hook')
  assert.match(vue, /vpi-delete/, 'uses the same icon as the site search clear button')
  assert.match(vue, /::-webkit-search-cancel-button/, 'hides the browser native clear to avoid a second one')
})

test('leaving the endpoints page restores content and reused outline entries', () => {
  const vue = readFileSync(new URL('../.vitepress/theme/RestEndpointsFilter.vue', import.meta.url), 'utf8')
  const cleanup = /onBeforeUnmount\(\(\) => \{([\s\S]*?)\n\}\)/.exec(vue)
  assert.ok(cleanup)
  const content = { style: { display: 'none' } }
  const outline = { style: { display: 'none' } }
  runInNewContext(cleanup[1], {
    sections: [{ nodes: [content] }],
    document: { querySelectorAll(selector) {
      assert.equal(selector, '.VPDocAsideOutline li')
      return [outline]
    } },
  })
  assert.equal(content.style.display, '')
  assert.equal(outline.style.display, '')
})

test('the theme registers the component the markdown tag resolves to', () => {
  const theme = readFileSync(new URL('../.vitepress/theme/index.js', import.meta.url), 'utf8')
  // markdown uses <rest-filter>; VitePress resolves kebab-case tags to PascalCase names.
  assert.match(theme, /app\.component\('RestFilter'/, 'kebab tag <rest-filter> maps to RestFilter')
})
