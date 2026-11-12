import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const docsRoot = process.env.THRUK_SOURCE ? path.resolve(process.env.THRUK_SOURCE, 'docs') : null
const page = (name) => docsRoot && path.join(docsRoot, 'documentation', name)

test('endpoints page is generated behind its marker and keeps the filter box', () => {
  if (!page('rest_endpoints.md') || !existsSync(page('rest_endpoints.md'))) return
  const md = readFileSync(page('rest_endpoints.md'), 'utf8')
  assert.equal((md.match(/<!--GENERATED-ENDPOINTS-->/g) || []).length, 1, 'one generator marker')
  const marker = md.indexOf('<!--GENERATED-ENDPOINTS-->')
  const body = md.slice(marker)
  const sections = body.match(/^### `(?:GET|POST|PATCH|DELETE) /gm)
  assert.ok(sections && sections.length > 100, `endpoint sections moved out of rest.md, got ${sections?.length}`)
  const rest = readFileSync(page('rest.md'), 'utf8')
  assert.ok(!/^### `/m.test(rest), 'rest.md no longer contains endpoint sections')
})

test('rest pages link to the endpoints page', () => {
  if (!page('rest.md') || !existsSync(page('rest.md'))) return
  for (const name of ['rest.md', 'rest_examples.md', 'rest_commands.md']) {
    const md = readFileSync(page(name), 'utf8')
    assert.match(md, /rest_endpoints\.html/, `${name} links to the endpoints page`)
  }
})

test('the filter placeholder example is a real substring of the endpoints page', () => {
  if (!page('rest_endpoints.md') || !existsSync(page('rest_endpoints.md'))) return
  const md = readFileSync(page('rest_endpoints.md'), 'utf8')
  const vue = readFileSync(path.join(root, '.vitepress/theme', 'RestEndpointsFilter.vue'), 'utf8')
  const placeholder = /placeholder="([^"]+)"/.exec(vue)
  assert.ok(placeholder, 'placeholder exists')
  const example = /ex\.:?\s*(\S+)/.exec(placeholder[1])
  assert.ok(example, 'placeholder contains an example')
  const pageText = md.replace(/`/g, '')
  assert.ok(pageText.includes(example[1]), `placeholder example "${example[1]}" matches the page`)
})

test('the navigation lists the endpoints page next to the REST API page', () => {
  const nav = readFileSync(path.join(root, 'scripts', 'nav.mts'), 'utf8')
  assert.match(nav, /\['rest', 'rest_endpoints', 'rest_commands'/, 'sidebar order')
})
