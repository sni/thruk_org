<script setup>
import { onMounted, ref } from 'vue'
import { releaseStatus } from './release-status.mjs'

const props = defineProps({ latest: { type: String, required: true } })
const installed = ref('')
const status = ref(null)
onMounted(() => {
  installed.value = new URLSearchParams(window.location.search).get('version') || ''
  status.value = releaseStatus(installed.value, props.latest)
})
</script>

<template>
  <div v-if="status" class="custom-block" :class="status === 'update' ? 'warning' : 'info'" role="status" aria-live="polite">
    <p class="custom-block-title">
      {{ status === 'update' ? 'Update available' : status === 'current' ? 'You use the latest stable release' : 'Version not recognized' }}
    </p>
    <p>Installed version: {{ installed }}. Latest stable release: v{{ latest }}.</p>
  </div>
</template>
