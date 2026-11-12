import { test } from 'node:test'
import assert from 'node:assert/strict'
import { releaseStatus } from '../.vitepress/theme/release-status.mjs'

test('the existing download.html?version= workflow compares numeric versions', () => {
  assert.equal(releaseStatus('3.9', '3.30'), 'update')
  assert.equal(releaseStatus('3.30', '3.30'), 'current')
  assert.equal(releaseStatus('v3.30', '3.30'), 'current')
  assert.equal(releaseStatus('3.30.0', '3.30'), 'current')
  assert.equal(releaseStatus('3.30.1', '3.30'), 'unknown')
  assert.equal(releaseStatus('4.0', '3.30'), 'unknown')
})

test('missing and development versions do not claim a known release', () => {
  assert.equal(releaseStatus(null, '3.30'), null)
  assert.equal(releaseStatus('3.30-dev', '3.30'), 'unknown')
  assert.equal(releaseStatus('<script>', '3.30'), 'unknown')
})
