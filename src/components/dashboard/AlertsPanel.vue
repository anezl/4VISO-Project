<script setup lang="ts">
import { Siren, TriangleAlert } from 'lucide-vue-next'

import StatusPill from '@/components/shared/StatusPill.vue'
import type { AlertItem } from '@/types/domain'
import { riskToTone } from '@/types/domain'

defineProps<{
  alerts: AlertItem[]
}>()
</script>

<template>
  <section class="panel-card">
    <div class="section-heading">
      <div>
        <p class="section-heading__eyebrow">Alerts & incidents</p>
        <h3>Live lane watch</h3>
      </div>

      <div class="section-heading__icon">
        <Siren :size="18" />
      </div>
    </div>

    <div v-if="alerts.length" class="alerts-list">
      <article v-for="alert in alerts" :key="alert.id" class="alert-row">
        <div class="alert-row__header">
          <strong>{{ alert.title }}</strong>
          <StatusPill :label="alert.severity" :tone="riskToTone(alert.severity)" />
        </div>

        <p class="alert-row__meta">{{ alert.category }} • {{ alert.timestamp }}</p>
        <p class="alert-row__body">{{ alert.description }}</p>
      </article>
    </div>

    <div v-else class="empty-state empty-state--compact">
      <TriangleAlert :size="20" />
      <p>No active alerts for this lane.</p>
    </div>
  </section>
</template>
