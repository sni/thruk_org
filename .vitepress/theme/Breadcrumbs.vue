<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { page } = useData()
const sections = {
  whatsnew: ['Release highlights', '/whatsnew/index.html'],
  documentation: ['Documentation', '/documentation/index.html'],
  guides: ['Guides', '/guides/first-steps.html'],
  development: ['Development', '/development/README.html']
}
const section = computed(() => sections[page.value.relativePath.split('/')[0]])
</script>

<template>
  <nav v-if="page.relativePath !== 'index.md'" class="breadcrumbs" aria-label="Breadcrumb">
    <ol>
      <li><a href="/">Home</a></li>
      <li v-if="section && '/' + page.relativePath.replace(/\.md$/, '.html') !== section[1]">
        <a :href="section[1]">{{ section[0] }}</a>
      </li>
      <li aria-current="page">{{ page.title }}</li>
    </ol>
  </nav>
</template>
