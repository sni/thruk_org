import { test } from 'vitest'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { checkDocs } from '../scripts/docs-check.mjs'

async function fixture(t, files, renderer) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'thruk-docs-'))
  t.onTestFinished(() => fs.rmSync(root, { recursive: true, force: true }))
  for (const [name, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true })
    fs.writeFileSync(path.join(root, name), content)
  }
  return checkDocs(root, renderer)
}

test('checks relative, root, reference and same-page links against rendered anchors', async (t) => {
  const result = await fixture(t, {
    'index.md': '# Home\n\n[One](page.md#first)\n[Two](/page.html#first)\n[Reference][ref]\n\n[ref]: page.md#first\n[Home](#home)\n',
    'page.md': '# First\n\n<a id="legacy"></a>\n[Old](#legacy)\n',
  })
  assert.deepEqual(result.errors, [])
  assert.equal(result.count, 2)
})

test('VitePress duplicate IDs and inline-code headings remain valid', async (t) => {
  const result = await fixture(t, {
    'index.md': '# First\n\n# First\n\n# `POST /hosts/<name>`\n\n[Duplicate](#first-1)\n[Endpoint](#post-hosts-name)\n',
  })
  assert.deepEqual(result.errors, [])
})

test('rejects missing targets, images and fragments, including same-page fragments', async (t) => {
  const result = await fixture(t, {
    'index.md': '# Home\n\n[Bad](gone.md)\n[Missing](#missing)\n![Image](gone.png)\n[Other](page.md#absent)\n',
    'page.md': '# First\n',
  })
  assert.equal(result.errors.length, 4)
  assert.match(result.errors.join('\n'), /missing anchor #missing/)
})

test('does not inspect examples inside mismatched nested fences', async (t) => {
  const result = await fixture(t, {
    'index.md': '# Home\n\n````text\n```\n~~~\n[Example](gone.md)\n{{ example }}\n== Old heading\n````\n',
  })
  assert.deepEqual(result.errors, [])
})

test('reports unclosed fences and old source formats', async (t) => {
  const result = await fixture(t, {
    'index.md': '# Home\n\n```text\nnever closed\n',
    'old.asciidoc': 'old',
    'other.ad': 'old',
  })
  assert.equal(result.errors.length, 3)
})

test('rejects Liquid, Jekyll metadata and AsciiDoc prose syntax', async (t) => {
  const result = await fixture(t, {
    'index.md': '---\nlayout: docs\n---\n# Home\n\n{% include old.ad %}\n== Old heading\n|===\nimage:old.png[Old]\n',
  })
  assert.equal(result.errors.length, 5)
})

test('checks HTML asset links but not HTML samples inside code', async (t) => {
  const result = await fixture(t, {
    'index.md': '# Home\n\n<img src="gone.png">\n\n```html\n<img src="example.png">\n```\n',
  })
  assert.equal(result.errors.length, 1)
  assert.match(result.errors[0], /gone.png/)
})

test('the public site can supply its renderer without installing dependencies in the docs checkout', async (t) => {
  let calls = 0
  const result = await fixture(t, { 'index.md': '# Source\n' }, {
    render() { calls++; return '<h1 id="provided"></h1><a href="#provided">Jump</a>' },
    utils: { unescapeAll: (value) => value },
  })
  assert.deepEqual(result.errors, [])
  assert.equal(calls, 1)
})

test('an ID shown in a code example is not a page anchor', async (t) => {
  const result = await fixture(t, {
    'index.md': '# Home\n\n[Missing](#example)\n\n```html\n<a id="example"></a>\n```\n',
  })
  assert.equal(result.errors.length, 1)
  assert.match(result.errors[0], /missing anchor #example/)
})

test('rejects migration debris that otherwise renders as ordinary prose', async (t) => {
  const result = await fixture(t, {
    'index.md': '# Home\n\n.Caption\n\n. First item\n\n+\n\nhttps://example.org[Label]\n\n  setting = value\n\nRepeated\n## Repeated\n',
    'untitled.md': 'A page without a title.\n',
  })
  assert.equal(result.errors.length, 7)
  assert.match(result.errors.join('\n'), /missing H1 heading/)
  assert.match(result.errors.join('\n'), /unfenced example/)
})

test('migration checks leave code and ordinary inline-code prose alone', async (t) => {
  const result = await fixture(t, {
    'index.md': '# Home\n\n`CGI & Access`. Under this heading, use `.deb` packages.\n\n```text\n.Caption\nhttps://example.org[Label]\n  setting = value\n```\n',
  })
  assert.deepEqual(result.errors, [])
})

test('duplicate heading checks do not cross a fenced example', async (t) => {
  const result = await fixture(t, {
    'index.md': '# Home\n\nRepeated\n```text\nexample\n```\n## Repeated\n',
  })
  assert.deepEqual(result.errors, [])
})

test('rejects unsupported admonitions that render as literal container markers', async (t) => {
  const result = await fixture(t, {
    'index.md': '# Home\n\n::: important\nUse the thruk user.\n:::\n\n::: info Important\nA supported note.\n:::\n',
  })
  assert.equal(result.errors.length, 1)
  assert.match(result.errors[0], /unsupported Markdown container important/)
})

test('rejects generated placeholders that Vue treats as unclosed HTML elements', async (t) => {
  const result = await fixture(t, {
    'index.md': '# API\n\n| Attribute | Description |\n| --- | --- |\n| panlet_<nr> | Dashboard panlet |\n',
  })
  assert.equal(result.errors.length, 1)
  assert.match(result.errors[0], /index\.md: Element is missing end tag\./)
  assert.match(result.errors[0], /<nr>/)
})

test('code-formatted placeholders compile while HTML void elements remain valid', async (t) => {
  const result = await fixture(t, {
    'index.md': '# API\n\n| Attribute | Description |\n| --- | --- |\n| `panlet_<nr>` | Dashboard panlet |\n\n<br>\n\n```text\n<nr>\n```\n',
  })
  assert.deepEqual(result.errors, [])
})
