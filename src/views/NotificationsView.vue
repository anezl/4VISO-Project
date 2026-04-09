<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'

import StatusPill from '@/components/shared/StatusPill.vue'
import { useWorkspaceStore } from '@/stores/workspace'
import { formatDateTime } from '@/utils/formatters'
import { riskToTone } from '@/types/domain'

const workspaceStore = useWorkspaceStore()

onMounted(async () => {
  await workspaceStore.loadWorkspace()
})
</script>

<template>
  <div class="page-section">
    <section class="hero-card">
      <div>
        <p class="section-heading__eyebrow">Inbox</p>
        <h1>Notifications and signal monitoring</h1>
        <p class="hero-card__copy">
          Centralized product notifications for lane disruptions, certificate issues, and validation events.
        </p>
      </div>
    </section>

    <section class="stack-list">
      <article
        v-for="notification in workspaceStore.notifications"
        :key="notification.id"
        class="stack-item stack-item--wide"
      >
        <div class="stack-item__row">
          <div>
            <strong>{{ notification.title }}</strong>
            <p>{{ notification.message }}</p>
          </div>

          <StatusPill :label="notification.severity" :tone="riskToTone(notification.severity)" />
        </div>

        <div class="stack-item__row">
          <p>{{ formatDateTime(notification.timestamp) }}</p>

          <div class="stack-item__actions">
            <RouterLink
              v-if="notification.shipmentId"
              :to="{ name: 'dashboard', params: { shipmentId: notification.shipmentId } }"
              class="button button--ghost"
            >
              Open lane
            </RouterLink>

            <button
              v-if="!notification.read"
              type="button"
              class="button button--secondary"
              @click="workspaceStore.markNotificationRead(notification.id)"
            >
              Mark as read
            </button>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>
