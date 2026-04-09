<script setup lang="ts">
import { ArrowRight, Clock3, Thermometer } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

import StatusPill from '@/components/shared/StatusPill.vue'
import type { Shipment } from '@/types/domain'
import { riskToTone } from '@/types/domain'

defineProps<{
  shipment: Shipment
  canEdit: boolean
}>()
</script>

<template>
  <article class="shipment-card">
    <div class="shipment-card__header">
      <div>
        <p class="shipment-card__reference">{{ shipment.reference }}</p>
        <h3>{{ shipment.title }}</h3>
      </div>

      <StatusPill :label="shipment.overallRisk" :tone="riskToTone(shipment.overallRisk)" />
    </div>

    <div class="shipment-card__lane">
      <div>
        <p class="shipment-card__label">Origin</p>
        <strong>{{ shipment.originCity }}</strong>
      </div>

      <ArrowRight :size="16" />

      <div>
        <p class="shipment-card__label">Destination</p>
        <strong>{{ shipment.destinationCity }}</strong>
      </div>
    </div>

    <div class="shipment-card__meta-grid">
      <div class="shipment-card__meta-item">
        <Clock3 :size="16" />
        <div>
          <p class="shipment-card__label">Status</p>
          <span>{{ shipment.status }}</span>
        </div>
      </div>

      <div class="shipment-card__meta-item">
        <Thermometer :size="16" />
        <div>
          <p class="shipment-card__label">Temperature</p>
          <span>{{ shipment.actualAverageTemp }} avg.</span>
        </div>
      </div>

      <div class="shipment-card__meta-item">
        <span class="shipment-card__meta-badge">{{ shipment.routeNodes.length }} nodes</span>
      </div>

      <div class="shipment-card__meta-item">
        <span class="shipment-card__meta-badge">{{ shipment.alerts.length }} active alerts</span>
      </div>
    </div>

    <div class="shipment-card__footer">
      <div>
        <p class="shipment-card__label">Owner</p>
        <span>{{ shipment.ownerCompany }}</span>
      </div>

      <RouterLink :to="{ name: 'dashboard', params: { shipmentId: shipment.id } }" class="button button--ghost">
        {{ canEdit ? 'Open and edit' : 'Open dashboard' }}
      </RouterLink>
    </div>
  </article>
</template>
