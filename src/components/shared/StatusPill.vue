<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    tone?:
      | 'low'
      | 'medium'
      | 'high'
      | 'critical'
      | 'validated'
      | 'pending'
      | 'rejected'
      | 'brand'
      | 'muted'
  }>(),
  {
    tone: 'muted',
  },
)

const toneClass = computed(() => `status-pill--${props.tone}`)
</script>

<template>
  <span class="status-pill" :class="toneClass">
    {{ label }}
  </span>
</template>
