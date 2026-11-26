import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { matchQuery } from '../.vitepress/theme/rest-filter.mjs'

const themeDir = new URL('../.vitepress/theme/', import.meta.url)

test('the outline filter hides non-matching "On this page" entries by their own text', () => {
  const vue = readFileSync(new URL('OutlineFilter.vue', themeDir), 'utf8')
  assert.match(vue, /import \{ matchQuery \} from '\.\/rest-filter\.mjs'/, 'reuses the REST filter matching (regexp chunks, case-insensitive)')
  assert.match(vue, /querySelector\('\.VPDocAsideOutline'\)/, 'selects the right-side outline, not the left sidebar')
  assert.match(vue, /\.VPDocOutlineItem > li/, 'selects the outline entries')
  assert.match(vue, /:scope > a\.outline-link/, 'matches on the entry link text, not the nested children')
  assert.match(vue, /li\.style\.display = /, 'hides with inline style so VitePress display rules cannot override')
  assert.match(vue, /const THRESHOLD = 20/, 'only shows the box above 20 entries')
  assert.match(vue, /v-if="show"/, 'renders nothing on pages with a short outline')
  assert.match(vue, /onContentUpdated\(update\)/, 'refreshes when VitePress re-renders the outline')
  assert.match(vue, /path !== lastPath[\s\S]*?query\.value = ''/, 'drops the query when navigating to another page')
  assert.match(vue, /new MutationObserver\(update\)/, 'observes the outline so the box appears on the first page, whose entries land after the one-shot checks')
  assert.match(vue, /childList: true, subtree: true/, 'watches entry changes without re-triggering on the display toggling')
  assert.match(vue, /aria-label="Clear filter"/, 'has a clear button like the other filters')
  assert.match(vue, /type="search"/, 'has a search input')
})

test('the theme wires the filter above the "On this page" outline', () => {
  const index = readFileSync(new URL('index.js', themeDir), 'utf8')
  assert.match(index, /import OutlineFilter from '\.\/OutlineFilter\.vue'/, 'component is imported')
  assert.match(index, /'aside-outline-before': \(\) => h\(OutlineFilter\)/, 'renders in the right aside above the outline')
})

test('a parent entry stays visible when a nested entry matches', () => {
  // The list must not be empty while the count reports matches: a nested
  // match keeps its parent chain visible.
  const vue = readFileSync(new URL('OutlineFilter.vue', themeDir), 'utf8')
  assert.match(vue, /const visible = matching\.has\(item\.li\) \|\| \[\.\.\.item\.li\.querySelectorAll\('li'\)\]\.some\(\(li\) => matching\.has\(li\)\)/, 'a parent entry is shown when a nested entry matches')
  assert.equal(matchQuery('configuration', 'configuration'), true, 'entry text matches its own query')
  assert.equal(matchQuery('menu editing', 'menu'), true, 'a nested entry matches independently of its parent')
})
