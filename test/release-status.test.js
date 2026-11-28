import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { releaseStatus } from '../.vitepress/theme/release-status.mjs'

// Derive the current release from the site metadata instead of pinning a
// version that changes on every release.
const env = readFileSync(fileURLToPath(new URL('../.env', import.meta.url)), 'utf8')
const latest = env.match(/^VITE_RELEASE_VERSION=([\d.]+)/m)[1]
const [major, minor] = latest.split('.').map(Number)
const older = `${major}.${minor - 1}`

test('the existing download.html?version= workflow compares numeric versions', () => {
  assert.equal(releaseStatus(older, latest), 'update')
  assert.equal(releaseStatus(latest, latest), 'current')
  assert.equal(releaseStatus(`v${latest}`, latest), 'current')
  assert.equal(releaseStatus(`${latest}.0`, latest), 'current')
  assert.equal(releaseStatus(`${latest}.1`, latest), 'unknown')
  assert.equal(releaseStatus(`${major + 1}.0`, latest), 'unknown')
})

test('missing and development versions do not claim a known release', () => {
  assert.equal(releaseStatus(null, latest), null)
  assert.equal(releaseStatus(`${latest}-dev`, latest), 'unknown')
  assert.equal(releaseStatus('<script>', latest), 'unknown')
})
