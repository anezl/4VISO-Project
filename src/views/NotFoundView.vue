<template>
  <div class="empty-state empty-state--page">
    <h2>Page not found</h2>
    <p>The route you requested does not exist in this workspace.</p>
    <RouterLink :to="{ name: 'shipments' }" class="button">Back to lanes</RouterLink>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>
