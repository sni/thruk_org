/* Filter logic for the REST API endpoints page.
 * Kept DOM-free (takes the content element) so it can be unit tested without
 * a browser. The Vue component wires the real DOM (and the "On this page"
 * outline) to this.
 */

// Each endpoint is an h3[id] heading; its section runs until the next h3.
// Returns [{ id, text, nodes }] where nodes includes the heading and every
// sibling up to (not including) the next h3. `id` links the section to the
// matching "On this page" outline item.
//
// The match text is the heading + prose/argument lists but NOT the attribute
// tables: a column name such as "lock", "name" or "host" appears in many
// unrelated endpoints' tables and would otherwise keep them all visible.
export function collectSections(docEl) {
  if (!docEl) return []
  const headings = docEl.querySelectorAll('h3[id]')
  const sections = []
  headings.forEach((heading) => {
    const nodes = [heading]
    for (let node = heading.nextElementSibling; node && node.tagName !== 'H3'; node = node.nextElementSibling) {
      nodes.push(node)
    }
    const text = nodes
      .filter((node) => node.tagName !== 'TABLE')
      .map((node) => node.textContent)
      .join('\n')
      .toLowerCase()
    sections.push({ id: heading.id, text, nodes })
  })
  return sections
}

// A query is whitespace-separated chunks; ALL chunks must match. Each chunk is
// a case-insensitive regular expression; an invalid one falls back to a
// literal substring. An empty query shows everything.
function chunkToRegExp(chunk) {
  try {
    return new RegExp(chunk, 'i')
  } catch {
    return new RegExp(chunk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  }
}

export function matchQuery(text, query) {
  const chunks = (query || '').trim().split(/\s+/).filter(Boolean).map(chunkToRegExp)
  return chunks.every((re) => re.test(text))
}

// Returns { visible: boolean[], shown: number }.
export function applyFilter(sections, query) {
  const visible = sections.map((section) => matchQuery(section.text, query))
  const shown = visible.filter(Boolean).length
  return { visible, shown }
}

// Keep an "On this page" outline entry visible when the query is empty or when
// the entry's own link or any nested link targets a matching endpoint. This
// collapses the branches that hold no matches so only the path to a match stays.
export function outlineVisible(linkIds, visibleIds, query) {
  const q = (query || '').trim()
  if (!q) return true
  return linkIds.some((id) => visibleIds.has(id))
}
