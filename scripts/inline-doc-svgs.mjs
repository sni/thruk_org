import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const isDoc = (file) => /^(documentation|guides|development)\//.test(file.split(path.sep).join('/'))

export function inlineDocSvgs(md, root) {
  const image = md.renderer.rules.image
  md.core.ruler.push('inline_doc_svgs', (state) => { state.env.inlineSvgIndex = 0 })
  md.renderer.rules.image = (tokens, index, options, env, self) => {
    const fallback = () => image(tokens, index, options, env, self)
    const src = tokens[index].attrGet('src') || ''
    if (!env.path || !isDoc(path.relative(root, env.path)) ||
        !/\.svg$/i.test(src) || /[?#]|^(?:[a-z][\w+.-]*:|\/\/)/i.test(src)) return fallback()

    // Linked images keep their native links and the site's image preview behaviour.
    for (let i = index - 1; i >= 0; i--) {
      if (tokens[i].type === 'link_open') return fallback()
      if (tokens[i].type === 'link_close') break
    }

    const url = decodeURIComponent(src)
    const file = url.startsWith('/') ? path.resolve(root, '.' + url) : path.resolve(path.dirname(env.path), url)
    if (!isDoc(path.relative(root, file))) return fallback()
    let svg = readFileSync(file, 'utf8').match(/<svg\b[^>]*\/>|<svg\b[\s\S]*<\/svg\s*>/i)?.[0]
    if (!svg) throw new Error(`Invalid SVG image: ${file}`)

    const page = createHash('sha256').update(path.relative(root, env.path)).digest('hex').slice(0, 12)
    const prefix = `doc-svg-${page}-${++env.inlineSvgIndex}-`
    const ids = new Map([...svg.matchAll(/\bid=(["'])(.*?)\1/g)].map((match) => [match[2], prefix + match[2]]))
    svg = svg
      .replace(/(\bid=)(["'])(.*?)\2/g, (_, attr, quote, id) => attr + quote + ids.get(id) + quote)
      .replace(/url\(\s*(["']?)#([^\s)"']+)\1\s*\)/g, (all, quote, id) => ids.has(id) ? `url(${quote}#${ids.get(id)}${quote})` : all)
      .replace(/(\b(?:xlink:)?href=)(["'])#(.*?)\2/g, (all, attr, quote, id) => ids.has(id) ? `${attr}${quote}#${ids.get(id)}${quote}` : all)
      .replace(/(\baria-(?:labelledby|describedby)=)(["'])(.*?)\2/g, (_, attr, quote, value) =>
        attr + quote + value.replace(/\S+/g, (id) => ids.get(id) || id) + quote)

    // Update ID selectors as well as url(#id) references in embedded styles.
    svg = svg.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (_, open, css, close) =>
      open + css.replace(/([^{}]+)\{/g, (_, selector) =>
        selector.replace(/#([\w-]+)/g, (all, id) => ids.has(id) ? '#' + ids.get(id) : all) + '{') + close)
    svg = svg.replace(/^<svg\b[^>]*>/i, (tag) => {
      if (!/\brole=/.test(tag)) tag = tag.replace('<svg', '<svg role="img"')
      if (!/\baria-(?:label|labelledby)=/.test(tag)) {
        const alt = self.renderInlineAsText(tokens[index].children, options, env)
        tag = tag.replace('<svg', `<svg aria-label="${md.utils.escapeHtml(alt)}"`)
      }
      return tag
    })
    // Tell VitePress to rebuild this page when the source diagram changes.
    if (!(env.includes ||= []).includes(file)) env.includes.push(file)
    return svg
  }
}
