<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'

import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import { useShipmentsStore } from '@/stores/shipments'
import { useWorkspaceStore } from '@/stores/workspace'

const shipmentsStore = useShipmentsStore()
const workspaceStore = useWorkspaceStore()

onMounted(async () => {
  await Promise.all([shipmentsStore.loadShipments(), workspaceStore.loadWorkspace()])
})
</script>

<template>
  <div class="app-shell">
    <AppSidebar />

    <div class="app-shell__content">
      <AppTopbar />

      <main class="page-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>
