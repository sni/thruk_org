<script setup>
import { nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { collectSections, applyFilter, outlineVisible } from './rest-filter.mjs'

const query = ref('')
const searchInput = ref(null)
const count = ref(null)
let sections = []

// Like the VitePress site search bar: clear the query and refocus the input.
function clear() {
  query.value = ''
  nextTick(() => searchInput.value && searchInput.value.focus())
}

// VitePress renders the page content and the "On this page" outline after the
// component mounts (outline via onContentUpdated), so the DOM is read fresh on
// every update rather than cached.
function update() {
  const doc = document.querySelector('.vp-doc')
  if (!doc) return
  if (!sections.length) sections = collectSections(doc)
  const { visible, shown } = applyFilter(sections, query.value)
  const q = query.value.trim()
  // Inline style (not the hidden attribute) so VitePress rules like
  // `.vp-doc table { display: block }` cannot override the hiding.
  const visibleIds = new Set()
  sections.forEach((section, i) => {
    const isShown = visible[i]
    if (isShown) visibleIds.add(section.id)
    section.nodes.forEach((node) => { node.style.display = isShown ? '' : 'none' })
  })
  // Hide the non-matching entries of the right-side "On this page" outline so
  // the navigation collapses to the matching endpoints.
  const entries = [...document.querySelectorAll('.VPDocAsideOutline a[href^="#"]')].map((a) => {
    const li = a.closest('li')
    const ids = [a.getAttribute('href').slice(1), ...[...li.querySelectorAll('a[href^="#"]')].map((x) => x.getAttribute('href').slice(1))]
    return { li, ids }
  })
  entries.forEach((entry) => {
    if (entry.li) entry.li.style.display = outlineVisible(entry.ids, visibleIds, query.value) ? '' : 'none'
  })
  if (count.value) {
    count.value.textContent = q ? `${shown} endpoint${shown === 1 ? '' : 's'}` : ''
  }
}

onMounted(() => {
  requestAnimationFrame(update)
  watch(query, update)
})

onBeforeUnmount(() => {
  sections.forEach((section) => section.nodes.forEach((node) => { node.style.display = '' }))
})
</script>

<template>
  <div class="rest-endpoints-filter">
    <label>
      <span class="rest-endpoints-box">
        <input ref="searchInput" v-model="query" type="search" placeholder="Filter endpoints (supports regexp) ex. GET /hosts" />
        <button v-if="query" aria-label="Clear filter" class="rest-endpoints-clear" type="button" @click="clear">
          <span aria-hidden="true" class="vpi-delete"></span>
        </button>
      </span>
      <span ref="count" class="rest-endpoints-count" aria-live="polite"></span>
    </label>
  </div>
</template>

<style scoped>
.rest-endpoints-filter {
  margin: 0 0 2rem;
}
/* The clear button lives inside the input's border, so the box (not the
   input) carries the styling. */
.rest-endpoints-box {
  display: flex;
  align-items: center;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}
.rest-endpoints-box:focus-within {
  border-color: var(--vp-c-brand-1);
}
.rest-endpoints-filter input {
  flex: 1;
  min-width: 0;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 0;
  background: transparent;
  color: var(--vp-c-text-1);
}
.rest-endpoints-filter input:focus {
  outline: none;
}
.rest-endpoints-count {
  display: block;
  padding-left: 0.75rem;
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
}
/* The box has its own clear button; hide the browser's native one so there
   is not a second ✕. */
.rest-endpoints-filter input::-webkit-search-cancel-button {
  -webkit-appearance: none;
}
.rest-endpoints-clear {
  padding: 0.5rem 0.5rem 0.5rem 0;
  border: 0;
  background: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.rest-endpoints-clear:hover {
  color: var(--vp-c-brand-1);
}
.rest-endpoints-clear .vpi-delete {
  display: block;
  font-size: 18px;
}
</style>
