<script setup lang="ts">
import { Plane, Ship, Truck } from 'lucide-vue-next'

import StatusPill from '@/components/shared/StatusPill.vue'
import type { Shipment, TransportMode } from '@/types/domain'
import { riskToTone, validationToTone } from '@/types/domain'

const props = defineProps<{
  shipment: Shipment
  selectedNodeId?: string | null
}>()

const emit = defineEmits<{
  selectNode: [nodeId: string]
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

function transportLabel(mode: TransportMode) {
  if (mode === 'Air') {
    return 'Air uplift'
  }

  if (mode === 'Sea') {
    return 'Sea or ferry leg'
  }

  return 'Road transfer'
}
</script>

<template>
  <section class="flow-card">
    <div class="section-heading">
      <div>
        <p class="section-heading__eyebrow">Route visualisation</p>
        <h3>Route overview</h3>
      </div>
    </div>

    <div class="flow-ribbon">
      <template v-for="(node, index) in shipment.routeNodes" :key="node.id">
        <button
          type="button"
          class="flow-node flow-node--ribbon"
          :class="{ 'flow-node--active': props.selectedNodeId === node.id }"
          @click="emit('selectNode', node.id)"
        >
          <div class="flow-node__headline">
            <div>
              <p class="flow-node__city">{{ node.city }}, {{ node.country }}</p>
              <h4>{{ node.locationName }}</h4>
              <StatusPill
                :label="node.riskScore"
                :tone="riskToTone(node.riskScore)"
                class="flow-node__risk"
              />
            </div>
          </div>

          <div class="flow-node__meta">
            <span>{{ node.locationType }}</span>
            <span>{{ node.validationStatus }}</span>
          </div>
        </button>

        <div
          v-if="index < shipment.routeNodes.length - 1"
          class="flow-connector flow-connector--transport"
          :data-testid="`connector-${index}`"
        >
          <div class="flow-connector__icon">
            <component :is="transportIcon(node.transportMode)" :size="18" />
          </div>

          <div class="flow-connector__content">
            <strong>{{ transportLabel(node.transportMode) }}</strong>
            <span>{{ node.transportMode }} to {{ shipment.routeNodes[index + 1]?.city }}</span>
          </div>
        </div>
      </template>
    </div>

    <details class="flow-details">
      <summary>Route quick facts</summary>

      <div class="flow-track flow-track--details">
        <article
          v-for="node in shipment.routeNodes"
          :key="`${node.id}-quick-facts`"
          class="flow-quick-card"
        >
          <div class="flow-quick-card__header">
            <div>
              <p class="flow-node__city">{{ node.city }}, {{ node.country }}</p>
              <strong>{{ node.locationName }}</strong>
            </div>

            <StatusPill
              :label="node.validationStatus"
              :tone="validationToTone(node.validationStatus)"
            />
          </div>

          <div class="flow-quick-card__grid">
            <div>
              <p class="flow-node__label">ETA</p>
              <strong>{{ node.eta }}</strong>
            </div>
            <div>
              <p class="flow-node__label">Mode</p>
              <strong>{{ node.transportMode }}</strong>
            </div>
            <div>
              <p class="flow-node__label">Required</p>
              <strong>{{ node.tempRange }}</strong>
            </div>
            <div>
              <p class="flow-node__label">Actual</p>
              <strong>{{ node.actualTemp }}</strong>
            </div>
          </div>
        </article>
      </div>
    </details>
  </section>
</template>
