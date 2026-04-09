<script setup lang="ts">
import { ArrowRight, ShieldCheck, ThermometerSnowflake } from 'lucide-vue-next'

import StatusPill from '@/components/shared/StatusPill.vue'
import type { Shipment } from '@/types/domain'
import { riskToTone, validationToTone } from '@/types/domain'

const props = defineProps<{
  shipment: Shipment
  selectedNodeId?: string | null
}>()

const emit = defineEmits<{
  selectNode: [nodeId: string]
}>()
</script>

<template>
  <section class="flow-card">
    <div class="section-heading">
      <div>
        <p class="section-heading__eyebrow">Route visualisation</p>
        <h3>Node-based lane flow</h3>
      </div>

      <div class="flow-card__legend">
        <div class="flow-card__legend-item">
          <ThermometerSnowflake :size="16" />
          <span>Cold-chain readings per node</span>
        </div>
        <div class="flow-card__legend-item">
          <ShieldCheck :size="16" />
          <span>Validation and certifications shown inline</span>
        </div>
      </div>
    </div>

    <div class="flow-track">
      <div
        v-for="(node, index) in shipment.routeNodes"
        :key="node.id"
        class="flow-track__segment"
      >
        <button
          type="button"
          class="flow-node"
          :class="{ 'flow-node--active': props.selectedNodeId === node.id }"
          @click="emit('selectNode', node.id)"
        >
          <div class="flow-node__top">
            <div>
              <p class="flow-node__city">{{ node.city }}, {{ node.country }}</p>
              <h4>{{ node.locationName }}</h4>
            </div>

            <StatusPill :label="node.riskScore" :tone="riskToTone(node.riskScore)" />
          </div>

          <div class="flow-node__info-grid">
            <div>
              <p class="flow-node__label">Point</p>
              <strong>{{ node.locationType }}</strong>
            </div>
            <div>
              <p class="flow-node__label">ETA</p>
              <strong>{{ node.eta }}</strong>
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

          <div class="flow-node__footer">
            <StatusPill
              :label="node.validationStatus"
              :tone="validationToTone(node.validationStatus)"
            />

            <p class="flow-node__certs">
              {{ node.certifications.join(' | ') }}
            </p>
          </div>
        </button>

        <div
          v-if="index < shipment.routeNodes.length - 1"
          class="flow-connector"
          :data-testid="`connector-${index}`"
        >
          <span>{{ node.transportMode }} to {{ shipment.routeNodes[index + 1]?.city }}</span>
          <ArrowRight :size="18" />
        </div>
      </div>
    </div>
  </section>
</template>
