import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createMarkdownRenderer } from 'vitepress'
import { inlineDocSvgs } from '../scripts/inline-doc-svgs.mjs'

test('automatically inline local documentation SVG images', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'thruk-inline-svg-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const svg = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" aria-labelledby="title description">
  <title id="title">Diagram</title><desc id="description">Description</desc>
  <defs><marker id="arrow"/><linearGradient id="gradient"/></defs>
  <style>#shape { fill: url('#gradient'); color: #fff; }</style>
  <path id="shape" marker-end="url(#arrow)"/><use href="#shape"/><use xlink:href='#shape'/>
</svg>`
  for (const [file, content] of Object.entries({
    'documentation/source/diagram.svg': svg,
    'documentation/source/plain diagram.svg': '<svg><text>Plain</text></svg>',
    'documentation/source/empty.svg': '<svg/>',
    'documentation/source/invalid.svg': '<html>Not an SVG</html>',
    'images/logo.svg': '<svg/>',
  })) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), content)
  }
  const md = await createMarkdownRenderer(root, { config: (md) => md.use(inlineDocSvgs, root) })
  const render = (text, page = 'documentation/page.md') => {
    const env = { path: path.join(root, page) }
    return { html: md.render(text, env), env }
  }

  await t.test('handles repeated, reference-style and root-relative images without ID collisions', () => {
    const source = '![One](source/diagram.svg)\n\n![Two][diagram]\n\n[diagram]: /documentation/source/diagram.svg'
    const { html, env } = render(source)
    assert.equal((html.match(/<svg\b/g) || []).length, 2)
    assert.doesNotMatch(html, /<img|<\?xml/)
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])
    assert.equal(ids.length, 10)
    assert.equal(new Set(ids).size, ids.length)
    for (const id of ids) assert.match(id, /^doc-svg-/)
    const [title, description, arrow, gradient, shape] = ids
    assert.ok(html.includes(`aria-labelledby="${title} ${description}"`))
    assert.ok(html.includes(`marker-end="url(#${arrow})"`))
    assert.ok(html.includes(`#${shape} { fill: url('#${gradient}'); color: #fff; }`))
    assert.ok(html.includes(`href="#${shape}"`))
    assert.ok(html.includes(`xlink:href='#${shape}'`))
    assert.deepEqual(env.includes, [path.join(root, 'documentation/source/diagram.svg')])
    assert.equal(render(source).html, html)
    assert.notEqual(render(source, 'documentation/another.md').html, html)
    assert.equal(render('![Diagram](../documentation/source/diagram.svg)', 'guides/page.md').env.includes.length, 1)
  })

  await t.test('keeps code, links, external URLs, fragments, query strings and branding unchanged', () => {
    const { html } = render([
      '![External](https://example.org/diagram.svg)',
      '![External](//example.org/diagram.svg)',
      '![Fragment](source/diagram.svg#shape)',
      '![Query](source/diagram.svg?v=1)',
      '![Branding](/images/logo.svg)',
      '![Outside](../../outside.svg)',
      '[Download](source/diagram.svg)',
      '[![Preview](source/diagram.svg)](source/diagram.svg)',
      '`![Example](source/diagram.svg)`',
      '```markdown\n![Example](source/diagram.svg)\n```',
    ].join('\n\n'))
    assert.doesNotMatch(html, /<svg\b/)
    assert.equal((html.match(/<img\b/g) || []).length, 7)
    assert.match(html, /href="source\/diagram\.svg"/)
    assert.match(html, /<code>!\[Example\]\(source\/diagram\.svg\)<\/code>/)
    assert.match(render('![Logo](/images/logo.svg)', 'development/logo.md').html, /<img/)
    assert.match(render('![Diagram](/documentation/source/diagram.svg)', 'index.md').html, /<img/)
  })

  await t.test('uses alternative text for unlabelled SVGs and fails on missing or invalid files', () => {
    const { html } = render('![A & B](source/plain%20diagram.svg)')
    assert.match(html, /<svg aria-label="A &amp; B" role="img">/)
    assert.match(render('![Empty](source/empty.svg)').html, /<svg aria-label="Empty" role="img"\/>/)
    assert.throws(() => render('![Missing](source/missing.svg)'), /ENOENT/)
    assert.throws(() => render('![Invalid](source/invalid.svg)'), /Invalid SVG image/)
  })
})
