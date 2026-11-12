<script setup>
import { inject, ref, watch } from 'vue'
import { useRoute } from 'vitepress'

defineProps({ text: String, items: Array })
const menu = ref()
const route = useRoute()
const closeScreen = inject('close-screen', () => {})

function follow() {
  menu.value.open = false
  closeScreen()
}

function escape() {
  menu.value.open = false
  menu.value.querySelector('summary').focus()
}

watch(() => route.path, () => { menu.value.open = false })
</script>

<template>
  <details ref="menu" class="nav-dropdown"
    @mouseenter="menu.open = true" @mouseleave="menu.open = false"
    @keydown.esc.stop.prevent="escape">
    <summary>
      <a :href="items[0].link" @click.stop="follow">{{ text }}</a>
      <span class="vpi-chevron-down" aria-hidden="true" />
    </summary>
    <ul>
      <li v-for="item in items" :key="item.link">
        <a :href="item.link" :aria-current="route.path === item.link ? 'page' : undefined"
          :target="item.link.startsWith('https://') ? '_blank' : undefined"
          :rel="item.link.startsWith('https://') ? 'noreferrer' : undefined" @click="follow">{{ item.text }}</a>
      </li>
    </ul>
  </details>
</template>

<style scoped>
.nav-dropdown { position: relative; font-size: 14px; font-weight: 500; }
summary { display: flex; align-items: center; gap: 4px; height: var(--vp-nav-height); padding: 0 12px; list-style: none; cursor: pointer; }
summary::-webkit-details-marker { display: none; }
summary a { line-height: var(--vp-nav-height); }
ul { position: absolute; right: 0; z-index: 1; min-width: 200px; padding: 12px; border: 1px solid var(--vp-c-divider); border-radius: 12px; background: var(--vp-c-bg-elv); box-shadow: var(--vp-shadow-3); list-style: none; }
li a { display: block; padding: 6px 12px; white-space: nowrap; }
a:hover { color: var(--vp-c-brand-1); }
a:focus-visible, summary:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 2px; }
</style>
