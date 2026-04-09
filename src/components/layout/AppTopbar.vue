<script setup lang="ts">
import { BellRing, FlaskConical, Search } from 'lucide-vue-next'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import StatusPill from '@/components/shared/StatusPill.vue'
import { useAuthStore } from '@/stores/auth'
import { useWorkspaceStore } from '@/stores/workspace'

const route = useRoute()
const authStore = useAuthStore()
const workspaceStore = useWorkspaceStore()

const pageTitle = computed(() => (route.meta.title as string | undefined) ?? '4VISO Workspace')
</script>

<template>
  <header class="topbar">
    <div class="topbar__title-group">
      <p class="topbar__eyebrow">Product workspace</p>
      <h2>{{ pageTitle }}</h2>
    </div>

    <div class="topbar__actions">
      <div class="topbar__chip topbar__chip--search">
        <Search :size="16" />
        <span>Search lanes, route nodes, certificates</span>
      </div>

      <RouterLink :to="{ name: 'notifications' }" class="topbar__notification">
        <BellRing :size="16" />
        <span>{{ workspaceStore.unreadNotifications.length }}</span>
      </RouterLink>

      <div class="topbar__profile">
        <div class="topbar__avatar">
          <FlaskConical :size="16" />
        </div>

        <div>
          <p class="topbar__profile-name">{{ authStore.currentUser?.fullName ?? 'Guest' }}</p>
          <StatusPill
            v-if="authStore.currentUser"
            :label="authStore.currentUser.companyName ?? 'Independent'"
            tone="brand"
          />
        </div>
      </div>
    </div>
  </header>
</template>
