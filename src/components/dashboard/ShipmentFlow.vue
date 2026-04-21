<script setup lang="ts">
import { computed } from 'vue'
import { Plane, Ship, Truck } from 'lucide-vue-next'

import StatusPill from '@/components/shared/StatusPill.vue'
import type { Shipment, TransportMode } from '@/types/domain'
import { riskToTone, validationToTone } from '@/types/domain'

const props = withDefaults(
  defineProps<{
    shipment: Shipment
    selectedNodeId?: string | null
    showQuickFacts?: boolean
  }>(),
  {
    selectedNodeId: null,
    showQuickFacts: true,
  },
)

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

const hasVisibleRoute = computed(() =>
  props.shipment.routeNodes.some((node) => node.city.trim() || node.locationName.trim()),
)

function nodeDisplayCity(node: Shipment['routeNodes'][number], index: number) {
  if (node.city.trim()) {
    return node.country.trim() ? `${node.city}, ${node.country}` : node.city
  }

  if (index === 0) {
    return 'Add origin'
  }

  if (index === props.shipment.routeNodes.length - 1) {
    return 'Add destination'
  }

  return 'Add stop'
}

function nodeDisplayName(node: Shipment['routeNodes'][number], index: number) {
  if (node.locationName.trim()) {
    return node.locationName
  }

  if (index === 0) {
    return 'Origin point'
  }

  if (index === props.shipment.routeNodes.length - 1) {
    return 'Destination point'
  }

  return 'Transit point'
}

function connectorLabel(node: Shipment['routeNodes'][number], index: number) {
  const nextCity = props.shipment.routeNodes[index + 1]?.city.trim()

  if (!node.city.trim() && !nextCity) {
    return 'Route will appear here'
  }

  return `${node.transportMode} to ${nextCity || 'next checkpoint'}`
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

    <div v-if="!hasVisibleRoute" class="flow-empty-state">
      <div class="flow-empty-state__node">
        <p class="flow-node__city">Origin</p>
        <strong>Add the shipping location</strong>
      </div>

      <div class="flow-connector flow-connector--transport flow-connector--placeholder">
        <div class="flow-connector__icon">
          <Truck :size="18" />
        </div>

        <div class="flow-connector__content">
          <strong>Route builder</strong>
          <span>Suggested routes appear after the first steps are filled in</span>
        </div>
      </div>

      <div class="flow-empty-state__node">
        <p class="flow-node__city">Destination</p>
        <strong>Add the receiving location</strong>
      </div>
    </div>

    <div v-else class="flow-ribbon">
      <template v-for="(node, index) in shipment.routeNodes" :key="node.id">
        <button
          type="button"
          class="flow-node flow-node--ribbon"
          :class="{ 'flow-node--active': props.selectedNodeId === node.id }"
          @click="emit('selectNode', node.id)"
        >
          <div class="flow-node__headline">
            <div>
              <p class="flow-node__city">{{ nodeDisplayCity(node, index) }}</p>
              <h4>{{ nodeDisplayName(node, index) }}</h4>
              <StatusPill
                v-if="node.city.trim() || node.locationName.trim()"
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
            <span>{{ connectorLabel(node, index) }}</span>
          </div>
        </div>
      </template>
    </div>

    <details v-if="props.showQuickFacts" class="flow-details">
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
