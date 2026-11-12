import { assert, test } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { parseChanges, releaseDate, releaseDay, renderChanges, renderReleaseNotes } from '../scripts/changes.mjs'

const sample = '# Changes\n\nnext:\n          - pending change\n\n3.30  Thu Oct 22 09:57:37 CEST 2026\n          - keep <code> & details\n            continuation\n\n'

test('release notes render nested lists, preserve literal text and leave examples alone', () => {
  const example = '```\nsetting = value\n```'
  const result = renderReleaseNotes('```\n3.30  Thu Oct 22 2026\n          - keep <code> & [details]\n            continuation\n          - Rest:\n            - nested change (#123)\n```\n\n' + example)
  assert.include(result, '- keep &lt;code&gt; &amp; \\[details\\]\n  continuation')
  assert.include(result, '- Rest:\n  - nested change')
  assert.include(result, example)
  assert.notInclude(result, '```\n3.30')
})

test('changelog dates stay out of the outline and change text loses its header and ten-space indent', () => {
  const parsed = parseChanges(sample)
  assert.equal(parsed.preamble + parsed.releases.map((release) => release.body).join(''), sample)
  assert.equal(parsed.releases[1].date, 'Thu Oct 22 09:57:37 CEST 2026')
  const rendered = renderChanges(sample, ['3.30'])
  assert.include(rendered, '<a id="v3.30"></a>')
  assert.include(rendered, '## v3.30 <time class="release-date ignore-header" datetime="2026-10-22">2026-10-22</time> {#v3-30}')
  assert.include(rendered, "[What's new in v3.30](/whatsnew/v3.30.html)")
  assert.include(rendered, '```text\n- keep <code> & details\n  continuation\n\n```')
  assert.include(rendered, '```text\n- pending change\n\n```')
  assert.notInclude(rendered, '3.30  Thu')
  assert.notInclude(rendered, '/whatsnew/vnext.html')
  assert.notInclude(renderChanges(sample), '/whatsnew/')
  assert.notInclude(rendered, parsed.preamble.trim())
})

test('calendar dates ignore time and timezone without moving to the previous day', () => {
  assert.equal(releaseDay('Thu Oct 22 00:30:00 CEST 2026'), '2026-10-22')
  assert.equal(releaseDay('Sun Mai 01 00:30:00 CEST 2011'), '2011-05-01')
  assert.equal(releaseDay('2009-11-08 16:10:34'), '2009-11-08')
})

test('release dates retain their timezone instead of using the build host timezone', () => {
  assert.equal(releaseDate('Thu Oct 22 09:57:37 CEST 2026').toISOString(), '2026-10-22T07:57:37.000Z')
  assert.equal(releaseDate('Thu Oct 22 09:57:37 CET 2026').toISOString(), '2026-10-22T08:57:37.000Z')
  assert.equal(releaseDate('Sun Mai 01 12:57:43 CEST 2011').toISOString(), '2011-05-01T10:57:43.000Z')
  assert.throws(() => releaseDate('not a date'), /Invalid release date/)
})

test('canonical release records have usable dates and supply the staged changelog', () => {
  assert.ok(process.env.THRUK_SOURCE, 'THRUK_SOURCE is required')
  const text = readFileSync(path.join(process.env.THRUK_SOURCE, 'Changes'), 'utf8')
  const parsed = parseChanges(text)
  assert.equal(parsed.preamble + parsed.releases.map((release) => release.body).join(''), text)
  for (const release of parsed.releases) {
    if (release.version !== 'next') assert.isFalse(Number.isNaN(releaseDate(release.date).getTime()), release.version)
  }
  const highlights = readdirSync(new URL('../src/whatsnew', import.meta.url)).filter((file) => /^v[\d.]+\.md$/.test(file)).map((file) => file.slice(1, -3))
  assert.equal(readFileSync(new URL('../.build/changelog.md', import.meta.url), 'utf8'), renderChanges(text, highlights))
})
