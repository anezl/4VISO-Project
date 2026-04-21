<script setup lang="ts">
import {
  Clock3,
  Plane,
  Ship,
  Thermometer,
  Truck,
} from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

import StatusPill from '@/components/shared/StatusPill.vue'
import type { Shipment, TransportMode } from '@/types/domain'
import { riskToTone } from '@/types/domain'

const props = defineProps<{
  shipment: Shipment
  canEdit: boolean
}>()

function transportIcon(mode: TransportMode) {
  if (mode === 'Air') {
    return Plane
  }

  if (mode === 'Sea') {
    return Ship
  }

  return Truck
}

function transportHint() {
  return props.shipment.routeNodes[0]?.transportMode ?? 'Road'
}

function displayValue(value: string, fallback: string) {
  return value.trim() || fallback
}
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
        <strong>{{ displayValue(shipment.originCity, 'Add origin') }}</strong>
      </div>

      <div class="shipment-card__transport-chip">
        <component :is="transportIcon(transportHint())" :size="16" />
        <span>{{ transportHint() }}</span>
      </div>

      <div>
        <p class="shipment-card__label">Destination</p>
        <strong>{{ displayValue(shipment.destinationCity, 'Add destination') }}</strong>
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
        <span class="shipment-card__meta-badge">{{ shipment.reportStatus }} report</span>
      </div>
    </div>

    <div class="shipment-card__footer">
      <div>
        <p class="shipment-card__label">Owner</p>
        <span>{{ displayValue(shipment.ownerCompany, 'Unassigned company') }}</span>
      </div>

      <RouterLink
        :to="{
          name: 'lane',
          params: { shipmentId: shipment.id },
          query: canEdit ? { edit: '1' } : undefined,
        }"
        class="button button--ghost"
      >
        Open lane
      </RouterLink>
    </div>
  </article>
</template>
