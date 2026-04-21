<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Lane, Requirement } from '@/types/domain'
import LaneFlowVisualization from '@/components/lanes/LaneFlowVisualization.vue'
import StatusPill from '@/components/shared/StatusPill.vue'
import { riskToTone } from '@/types/domain'

interface Props {
  lanes: Lane[]
  requirements: Requirement[]
}

defineProps<Props>()

const selectedLaneId = ref<string | null>(null)
const selectedProductType = ref<string>('Vaccines')
const isEditingLane = ref(false)

const availableProductTypes = (lanes: Lane[]): string[] => {
  return [...new Set(lanes.map((l) => l.productType))]
}

const filteredLanes = computed(() => {
  const props = defineProps<Props>()
  return props.lanes.filter((lane) => lane.productType === selectedProductType.value)
})

const selectedLane = computed(() => {
  return selectedLaneId.value ? filteredLanes.value.find((l) => l.id === selectedLaneId.value) : null
})

const matchingRequirement = computed(() => {
  if (!selectedLane.value) return undefined
  return props.requirements.find((r) => r.productType === selectedLane.value?.productType)
})

//const props = defineProps<Props>()

const handleLaneUpdate = (updatedLane: Lane) => {
  // In a real app, would call API to save
  console.log('Lane updated:', updatedLane)
}

const handleSelectLane = () => {
  // In a real app, would emit or navigate to shipment creation
  console.log('Lane selected:', selectedLane.value)
}
</script>

<template>
  <div class="lane-creation-container">
    <!-- Product Type Filter -->
    <div class="filter-section">
      <h2>Lane Risk Assessment</h2>
      <div class="product-filter">
        <button
          v-for="productType in availableProductTypes(lanes)"
          :key="productType"
          :class="['filter-button', { active: selectedProductType === productType }]"
          @click="selectedProductType = productType"
        >
          {{ productType }}
        </button>
      </div>
    </div>

    <div class="lanes-grid">
      <!-- Lane Options List -->
      <div class="lanes-list">
        <div class="list-header">
          <h3>Available Routes ({{ filteredLanes.length }})</h3>
          <p class="list-subtitle">Select a route to view detailed lane information</p>
        </div>

        <div class="lanes-items">
          <div
            v-for="lane in filteredLanes"
            :key="lane.id"
            :class="['lane-card', { selected: selectedLaneId === lane.id }]"
            @click="selectedLaneId = selectedLaneId === lane.id ? null : lane.id"
          >
            <div class="lane-card-header">
              <div>
                <h4>{{ lane.originCity }} → {{ lane.destinationCity }}</h4>
                <p class="lane-route">
                  {{ lane.nodes.length }} stops • {{ lane.transportationSegments.length }} transports
                </p>
              </div>
              <StatusPill :label="lane.overallRisk" :tone="riskToTone(lane.overallRisk)" />
            </div>

            <div class="lane-card-metrics">
              <div class="metric">
                <span class="metric-label">Status</span>
                <span class="metric-value">{{ lane.status }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Temp Range</span>
                <span class="metric-value">{{ lane.requiredTempRange }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Est. Duration</span>
                <span class="metric-value">{{
                  lane.transportationSegments.reduce((acc, s) => acc + s.estimatedDurationHours, 0)
                }}
                h</span>
              </div>
            </div>

            <div class="lane-card-nodes">
              <div v-for="node in lane.nodes" :key="node.id" class="node-tag">
                {{ node.city }}
              </div>
            </div>
          </div>

          <div v-if="filteredLanes.length === 0" class="empty-state">
            <p>No routes available for this product type</p>
          </div>
        </div>
      </div>

      <!-- Lane Detail View -->
      <div class="lane-detail">
        <div v-if="selectedLane" class="detail-content">
          <LaneFlowVisualization
            :lane="selectedLane"
            :requirement="matchingRequirement"
            :editable="isEditingLane"
            @update="handleLaneUpdate"
            @add-node="() => console.log('Add node clicked')"
          />

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button
              v-if="!isEditingLane"
              class="btn btn-secondary"
              @click="isEditingLane = true"
            >
              Edit Lane
            </button>
            <button
              v-if="isEditingLane"
              class="btn btn-secondary"
              @click="isEditingLane = false"
            >
              Done Editing
            </button>
            <button class="btn btn-secondary">Compare with Other</button>
            <button class="btn btn-primary" @click="handleSelectLane">Select This Route</button>
          </div>
        </div>

        <div v-else class="empty-detail">
          <p>Select a route to view details and flow diagram</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lane-creation-container {
  padding: 24px;
}

.filter-section {
  margin-bottom: 32px;
}

.filter-section h2 {
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.product-filter {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-button {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s ease;
}

.filter-button:hover {
  border-color: #9ca3af;
  color: #374151;
}

.filter-button.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.lanes-grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 24px;
}

@media (max-width: 1200px) {
  .lanes-grid {
    grid-template-columns: 1fr;
  }
}

.lanes-list {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.list-header {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.list-header h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.list-subtitle {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.lanes-items {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.lane-card {
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lane-card:hover {
  background: #f9fafb;
}

.lane-card.selected {
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
  padding-left: 9px;
}

.lane-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}

.lane-card-header h4 {
  margin: 0 0 2px 0;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.lane-route {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.lane-card-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 500;
  text-transform: uppercase;
}

.metric-value {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.lane-card-nodes {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.node-tag {
  display: inline-block;
  background: #f0fdf4;
  color: #166534;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.empty-state {
  padding: 32px 16px;
  text-align: center;
  color: #9ca3af;
}

.lane-detail {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.detail-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.empty-detail {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  padding: 40px 20px;
  text-align: center;
}

.action-buttons {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.btn {
  flex: 1;
  padding: 10px 16px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f3f4f6;
}
</style>
