import { test } from 'node:test'
import assert from 'node:assert/strict'
import { releaseStatus } from '../.vitepress/theme/release-status.mjs'

test('the existing download.html?version= workflow compares numeric versions', () => {
  assert.equal(releaseStatus('3.30', '3.32'), 'update')
  assert.equal(releaseStatus('3.32', '3.32'), 'current')
  assert.equal(releaseStatus('v3.32', '3.32'), 'current')
  assert.equal(releaseStatus('3.32.0', '3.32'), 'current')
  assert.equal(releaseStatus('3.32.1', '3.32'), 'unknown')
  assert.equal(releaseStatus('4.0', '3.32'), 'unknown')
})

test('missing and development versions do not claim a known release', () => {
  assert.equal(releaseStatus(null, '3.32'), null)
  assert.equal(releaseStatus('3.32-dev', '3.32'), 'unknown')
  assert.equal(releaseStatus('<script>', '3.32'), 'unknown')
})
