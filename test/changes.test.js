import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { parseChanges, releaseDate, releaseDay, renderChanges, renderReleaseNotes } from '../scripts/changes.mjs'

const sample = '# Changes\n\nnext:\n          - pending change\n\n3.30  Thu Oct 22 09:57:37 CEST 2026\n          - keep <code> & details\n            continuation\n\n'

test('release notes render nested lists, preserve literal text and leave examples alone', () => {
  const example = '```\nsetting = value\n```'
  const result = renderReleaseNotes('```\n3.30  Thu Oct 22 2026\n          - keep <code> & [details]\n            continuation\n          - Rest:\n            - nested change (#123)\n```\n\n' + example)
  assert.ok(result.includes('- keep &lt;code&gt; &amp; \\[details\\]\n  continuation'))
  assert.ok(result.includes('- Rest:\n  - nested change'))
  assert.ok(result.includes(example))
  assert.ok(!result.includes('```\n3.30'))
})

test('changelog dates stay out of the outline and change text loses its header and ten-space indent', () => {
  const parsed = parseChanges(sample)
  assert.equal(parsed.preamble + parsed.releases.map((release) => release.body).join(''), sample)
  assert.equal(parsed.releases[1].date, 'Thu Oct 22 09:57:37 CEST 2026')
  const rendered = renderChanges(sample, ['3.30'])
  assert.ok(rendered.includes('<a id="v3.30"></a>'))
  assert.ok(rendered.includes('## v3.30 <time class="release-date ignore-header" datetime="2026-10-22">2026-10-22</time> {#v3-30}'))
  assert.ok(rendered.includes("[What's new in v3.30](/whatsnew/v3.30.html)"))
  assert.ok(rendered.includes('```text\n- keep <code> & details\n  continuation\n\n```'))
  assert.ok(rendered.includes('```text\n- pending change\n\n```'))
  assert.ok(!rendered.includes('3.30  Thu'))
  assert.ok(!rendered.includes('/whatsnew/vnext.html'))
  assert.ok(!renderChanges(sample).includes('/whatsnew/'))
  assert.ok(!rendered.includes(parsed.preamble.trim()))
})

test('hyphenated releases keep separate changes, dates and legacy anchors', () => {
  const text = '3.08  Sat Jul 1 2023\n          - newer change\n\n3.06-2  Tue Jun 6 2023\n          - security fix\n\n3.06  Wed May 24 2023\n          - original change\n'
  const { releases } = parseChanges(text)
  assert.deepEqual(releases.map((release) => release.version), ['3.08', '3.06-2', '3.06'])
  assert.equal(releases[1].date, 'Tue Jun 6 2023')
  assert.ok(!releases[0].body.includes('security fix'))
  assert.ok(releases[1].body.includes('security fix'))
  assert.ok(!releases[1].body.includes('original change'))
  const rendered = renderChanges(text)
  assert.ok(rendered.includes('<a id="v3.06-2"></a>'))
  assert.ok(rendered.includes('## v3.06-2 <time class="release-date ignore-header" datetime="2023-06-06">2023-06-06</time> {#v3-06-2}'))
  assert.ok(!rendered.includes('3.06-2  Tue'))
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
    if (release.version !== 'next') assert.equal(Number.isNaN(releaseDate(release.date).getTime()), false, release.version)
  }
  const highlights = readdirSync(new URL('../src/whatsnew', import.meta.url)).filter((file) => /^v[\d.]+\.md$/.test(file)).map((file) => file.slice(1, -3))
  assert.equal(readFileSync(new URL('../.build/changelog.md', import.meta.url), 'utf8'), renderChanges(text, highlights))
})
