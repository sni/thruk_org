export function imagePreview(event, origin) {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
  const link = event.target.closest?.('.vp-doc a')
  if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return
  const image = link.querySelector('img')
  if (!image) return
  const url = new URL(link.href)
  if (url.origin !== origin || !/\.(?:png|jpe?g|gif|webp|avif|svg)$/i.test(url.pathname)) return
  const panel = link.closest?.('.logo-preview')
  const background = panel ? (panel.classList.contains('dark') ? '#1b1b1f' : '#fff') : undefined
  return { link, src: url.href, alt: image.alt || 'Enlarged image', background }
}
