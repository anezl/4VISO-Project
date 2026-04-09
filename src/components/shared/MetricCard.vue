<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value: string | number
    helper?: string
    tone?: 'default' | 'brand' | 'warning'
  }>(),
  {
    helper: '',
    tone: 'default',
  },
)
</script>

<template>
  <article class="metric-card" :class="`metric-card--${tone}`">
    <p class="metric-card__label">{{ label }}</p>
    <strong class="metric-card__value">{{ value }}</strong>
    <p v-if="helper" class="metric-card__helper">{{ helper }}</p>
  </article>
</template>
