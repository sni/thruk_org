import { assert, test } from 'vitest'
import { imagePreview } from '../.vitepress/theme/image-preview.mjs'

function click(href = 'https://www.thruk.org/images/screenshot.png') {
  const link = {
    href,
    target: '',
    hasAttribute: () => false,
    querySelector: () => ({ alt: 'Dashboard' }),
  }
  return { button: 0, target: { closest: () => link } }
}

test('linked screenshots open at full size with their alternative text', () => {
  const event = click()
  const preview = imagePreview(event, 'https://www.thruk.org')
  assert.equal(preview.src, 'https://www.thruk.org/images/screenshot.png')
  assert.equal(preview.alt, 'Dashboard')
  assert.equal(preview.link, event.target.closest())
})

test('logo previews preserve the showcase panel background', () => {
  for (const [dark, background] of [[true, '#1b1b1f'], [false, '#fff']]) {
    const event = click('https://www.thruk.org/images/thruk.svg')
    event.target.closest().closest = () => ({ classList: { contains: () => dark } })
    assert.equal(imagePreview(event, 'https://www.thruk.org').background, background)
  }
})

test('ordinary links, external links, downloads and modified clicks keep their browser behaviour', () => {
  for (const changes of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { defaultPrevented: true }]) {
    assert.isUndefined(imagePreview({ ...click(), ...changes }, 'https://www.thruk.org'))
  }
  for (const href of ['https://example.org/image.png', 'https://www.thruk.org/download.html']) {
    assert.isUndefined(imagePreview(click(href), 'https://www.thruk.org'))
  }
  const event = click()
  const link = event.target.closest()
  link.target = '_blank'
  assert.isUndefined(imagePreview(event, 'https://www.thruk.org'))
  link.target = ''
  link.hasAttribute = () => true
  assert.isUndefined(imagePreview(event, 'https://www.thruk.org'))
  link.hasAttribute = () => false
  link.querySelector = () => null
  assert.isUndefined(imagePreview(event, 'https://www.thruk.org'))
  event.target.closest = () => null
  assert.isUndefined(imagePreview(event, 'https://www.thruk.org'))
})
