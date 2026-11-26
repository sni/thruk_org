<script setup>
import { nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { matchQuery } from './rest-filter.mjs'
import { onContentUpdated } from 'vitepress'

// A quick filter for the right-hand "On this page" outline on pages with a
// long outline (e.g. the configuration page). It renders above the outline
// and hides entries by their own text; a parent stays visible when one of
// its nested entries matches.
const query = ref('')
const searchInput = ref(null)
const count = ref(null)
// Only shown when the outline is long enough to need a search box.
const show = ref(false)
const THRESHOLD = 20

// Like the VitePress site search bar: clear the query and refocus the input.
function clear() {
  query.value = ''
  nextTick(() => searchInput.value && searchInput.value.focus())
}

// The component stays mounted across route changes, so the DOM is read fresh
// on every update and the query is dropped when the page itself changes.
// The URL is read from location (the SPA keeps it in sync); the useData
// route ref is not reliable before the first content update.
let lastPath = null

function update() {
  const path = location.pathname
  if (path !== lastPath) {
    lastPath = path
    query.value = ''
  }
  const outline = document.querySelector('.VPDocAsideOutline')
  if (!outline) {
    show.value = false
    return
  }
  // Every entry at every nesting level; an entry's own text is its link, not
  // the text of its nested children.
  const items = [...outline.querySelectorAll('.VPDocOutlineItem > li')].map((li) => ({
    li,
    text: (li.querySelector(':scope > a.outline-link')?.textContent || '').toLowerCase(),
  }))
  const q = query.value.trim()
  show.value = items.length > THRESHOLD
  if (!show.value || !q) {
    items.forEach(({ li }) => { li.style.display = '' })
    if (count.value) count.value.textContent = ''
    return
  }
  // An entry must be visible when it or any of its nested entries matches;
  // hiding a parent would hide nested matches with it.
  const matching = new Set(items.filter((item) => matchQuery(item.text, query.value)).map((item) => item.li))
  // Inline style (not the hidden attribute) so VitePress rules cannot
  // override the hiding.
  let shown = 0
  items.forEach((item) => {
    const visible = matching.has(item.li) || [...item.li.querySelectorAll('li')].some((li) => matching.has(li))
    if (visible) shown++
    item.li.style.display = visible ? '' : 'none'
  })
  if (count.value) {
    count.value.textContent = `${shown} of ${items.length} items`
  }
}

// VitePress fills the outline entries from its own callback, which can land
// after the initial one-shot checks below; observe the element so the box
// appears as soon as the entries exist, not one page late.
let observer = null

function watchOutline() {
  const outline = document.querySelector('.VPDocAsideOutline')
  if (!outline) return
  // Only childList: the display toggling in update() touches attributes and
  // would otherwise re-trigger the observer.
  observer = new MutationObserver(update)
  observer.observe(outline, { childList: true, subtree: true })
}

onMounted(() => {
  requestAnimationFrame(() => {
    watchOutline()
    update()
  })
  watch(query, update)
  // The outline is (re)rendered after the content updates; refresh the item
  // set (and the count) then.
  onContentUpdated(update)
})

onBeforeUnmount(() => {
  if (observer) observer.disconnect()
  document.querySelectorAll('.VPDocAsideOutline li').forEach((item) => { item.style.display = '' })
})
</script>

<template>
  <div v-if="show" class="outline-filter">
    <label>
      <span class="outline-filter-box">
        <span aria-hidden="true" class="vpi-search outline-filter-icon"></span>
        <input ref="searchInput" v-model="query" type="search" placeholder="Outline filter" />
        <button v-if="query" aria-label="Clear filter" class="outline-filter-clear" type="button" @click="clear">
          <span aria-hidden="true" class="vpi-delete"></span>
        </button>
      </span>
      <span ref="count" class="outline-filter-count" aria-live="polite"></span>
    </label>
  </div>
</template>

<style scoped>
.outline-filter {
  margin: 0 0 1rem;
}
/* Same box, icon, input, clear button and watermark colours as the REST
   endpoints filter so both look like one site-wide pattern. */
.outline-filter-box {
  display: flex;
  align-items: center;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}
.outline-filter-box:focus-within {
  border-color: var(--vp-c-brand-1);
}
.outline-filter-icon {
  padding-left: 1.75rem;
  color: var(--vp-c-text-2);
  font-size: 18px;
}
.outline-filter input {
  flex: 1;
  min-width: 0;
  padding: 0.5rem 0.75rem 0.5rem 0.25rem;
  font-size: 0.875rem;
  border: 0;
  background: transparent;
  color: var(--vp-c-text-1);
}
.outline-filter input::placeholder {
  color: var(--vp-c-text-2);
}
.outline-filter input:focus {
  outline: none;
}
.outline-filter input::-webkit-search-cancel-button {
  -webkit-appearance: none;
}
.outline-filter-clear {
  padding: 0.5rem 0.5rem 0.5rem 0;
  border: 0;
  background: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.outline-filter-clear:hover {
  color: var(--vp-c-brand-1);
}
.outline-filter-clear .vpi-delete {
  display: block;
  font-size: 18px;
}
.outline-filter-count {
  display: block;
  padding-left: 0.75rem;
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
}
</style>
