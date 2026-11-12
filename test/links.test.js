import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { checkLinks } from '../scripts/check_links.mjs'

async function fixture(files) {
  const root = mkdtempSync(path.join(tmpdir(), 'thruk-links-'))
  try {
    for (const [file, text] of Object.entries(files)) {
      mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
      writeFileSync(path.join(root, file), text)
    }
    return await checkLinks(root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test('browser-relative paths, directory indexes and old named anchors work without rewrites', async () => {
  const result = await fixture({
    'index.html': '<a href="nested/">Nested</a><a name="old"></a>',
    'nested/index.html': '<a href="./../index.html#old">Home</a><img src="../image.svg#icon">',
    'image.svg': '<svg><g id="icon"></g></svg>',
  })
  assert.deepEqual(result, { pages: 2, errors: [] })
})

test('reports missing files and fragments without requesting external resources', async () => {
  const result = await fixture({
    'index.html': '<a href="#gone">Missing</a><img src="gone.png"><a href="https://example.invalid/">External</a><img src="data:image/png;base64,AAAA">',
  })
  assert.equal(result.errors.length, 2)
})
