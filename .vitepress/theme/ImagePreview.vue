<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vitepress'
import { imagePreview } from './image-preview.mjs'

const dialog = ref()
const image = ref()
const route = useRoute()

async function open(event) {
  if (!dialog.value?.showModal) return
  const preview = imagePreview(event, window.location.origin)
  if (!preview) return
  event.preventDefault()
  preview.link.focus()
  image.value = preview
  await nextTick()
  dialog.value.showModal()
}

watch(() => route.path, () => dialog.value?.close())
onMounted(() => document.addEventListener('click', open))
onBeforeUnmount(() => document.removeEventListener('click', open))
</script>

<template>
  <dialog ref="dialog" class="image-preview" aria-label="Image preview" @click.self="dialog.close()">
    <form method="dialog">
      <button autofocus aria-label="Close image preview">Close ×</button>
    </form>
    <img v-if="image" :src="image.src" :alt="image.alt" :style="{ background: image.background }">
  </dialog>
</template>

<style scoped>
.image-preview {
  margin: auto;
  max-width: 96vw;
  max-height: 96vh;
  padding: 12px;
  border: 0;
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}
.image-preview::backdrop {
  background: rgb(0 0 0 / 75%);
}
.image-preview form {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}
.image-preview button {
  padding: 4px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  cursor: pointer;
}
.image-preview button:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}
.image-preview img {
    display: block;
  width: min(90vw, 1100px);
  height: min(75vh, 800px);
  max-width: 90vw;
  max-height: calc(90vh - 48px);
  object-fit: contain;
}
</style>
