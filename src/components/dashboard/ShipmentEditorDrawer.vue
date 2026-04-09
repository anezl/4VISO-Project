<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type {
  LocationType,
  RiskLevel,
  Shipment,
  ShipmentStatus,
  TransportMode,
  ValidationStatus,
} from '@/types/domain'

const props = defineProps<{
  open: boolean
  shipment: Shipment | null
}>()

const emit = defineEmits<{
  close: []
  save: [shipment: Shipment]
}>()

const form = ref<Shipment | null>(null)
const certificationsMap = ref<Record<string, string>>({})

const shipmentStatuses: ShipmentStatus[] = ['Scheduled', 'In Transit', 'Delayed', 'Delivered']
const riskLevels: RiskLevel[] = ['Low', 'Medium', 'High', 'Critical']
const validationStatuses: ValidationStatus[] = ['Validated', 'Pending', 'Rejected']
const locationTypes: LocationType[] = [
  'Warehouse',
  'Airport',
  'Hub',
  'Distribution Center',
  'Port',
]
const transportModes: TransportMode[] = ['Road', 'Air', 'Sea']

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function syncForm(nextShipment: Shipment | null) {
  form.value = nextShipment ? structuredClone(nextShipment) : null
  certificationsMap.value = {}

  if (!nextShipment) {
    return
  }

  nextShipment.routeNodes.forEach((node) => {
    certificationsMap.value[node.id] = node.certifications.join(', ')
  })
}

watch(
  () => props.shipment,
  (nextShipment) => {
    syncForm(nextShipment)
  },
  { immediate: true },
)

const canRemoveNode = computed(() => (form.value?.routeNodes.length ?? 0) > 2)

function addNode() {
  if (!form.value) {
    return
  }

  const nodeId = generateId('node')

  form.value.routeNodes.push({
    id: nodeId,
    city: 'New city',
    country: 'Country',
    locationName: 'New checkpoint',
    locationType: 'Hub',
    transportMode: 'Road',
    eta: 'TBD',
    tempRange: form.value.requiredTempRange,
    actualTemp: form.value.actualAverageTemp,
    riskScore: 'Medium',
    certifications: ['EU GDP'],
    validationStatus: 'Pending',
  })

  certificationsMap.value[nodeId] = 'EU GDP'
}

function removeNode(nodeId: string) {
  if (!form.value || form.value.routeNodes.length <= 2) {
    return
  }

  form.value.routeNodes = form.value.routeNodes.filter((node) => node.id !== nodeId)
  delete certificationsMap.value[nodeId]
}

function handleSave() {
  if (!form.value) {
    return
  }

  form.value.routeNodes = form.value.routeNodes.map((node) => ({
    ...node,
    certifications: (certificationsMap.value[node.id] ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  }))

  form.value.originCity = form.value.routeNodes[0]?.city ?? form.value.originCity
  form.value.destinationCity =
    form.value.routeNodes[form.value.routeNodes.length - 1]?.city ?? form.value.destinationCity

  emit('save', structuredClone(form.value))
}
</script>

<template>
  <Transition name="drawer-fade">
    <div v-if="open" class="drawer-backdrop" @click.self="emit('close')">
      <aside class="editor-drawer">
        <div class="editor-drawer__header">
          <div>
            <p class="section-heading__eyebrow">Route editor</p>
            <h3>Edit lane configuration</h3>
          </div>

          <button type="button" class="button button--ghost" @click="emit('close')">Close</button>
        </div>

        <div v-if="form" class="editor-drawer__body">
          <section class="editor-drawer__section">
            <label>
              <span>Shipment title</span>
              <input v-model="form.title" class="input" />
            </label>
            <label>
              <span>Owner company</span>
              <input v-model="form.ownerCompany" class="input" />
            </label>
            <label>
              <span>Consignee</span>
              <input v-model="form.consignee" class="input" />
            </label>
            <label>
              <span>Product name</span>
              <input v-model="form.productName" class="input" />
            </label>
            <label>
              <span>Package type</span>
              <input v-model="form.packageType" class="input" />
            </label>
            <label>
              <span>Status</span>
              <select v-model="form.status" class="input">
                <option v-for="status in shipmentStatuses" :key="status" :value="status">
                  {{ status }}
                </option>
              </select>
            </label>
            <label>
              <span>Overall risk</span>
              <select v-model="form.overallRisk" class="input">
                <option v-for="risk in riskLevels" :key="risk" :value="risk">
                  {{ risk }}
                </option>
              </select>
            </label>
            <label>
              <span>Required temperature</span>
              <input v-model="form.requiredTempRange" class="input" />
            </label>
            <label>
              <span>Average temperature</span>
              <input v-model="form.actualAverageTemp" class="input" />
            </label>
            <label>
              <span>Progress %</span>
              <input v-model.number="form.progress" type="number" min="0" max="100" class="input" />
            </label>
          </section>

          <section class="editor-drawer__section">
            <div class="editor-drawer__section-header">
              <div>
                <p class="section-heading__eyebrow">Nodes</p>
                <h4>Stops and transport handovers</h4>
              </div>

              <button type="button" class="button button--secondary" @click="addNode">
                Add node
              </button>
            </div>

            <article
              v-for="(node, index) in form.routeNodes"
              :key="node.id"
              class="editor-node-card"
            >
              <div class="editor-node-card__header">
                <h5>Node {{ index + 1 }}</h5>

                <button
                  type="button"
                  class="button button--ghost"
                  :disabled="!canRemoveNode"
                  @click="removeNode(node.id)"
                >
                  Remove
                </button>
              </div>

              <div class="editor-node-card__grid">
                <label>
                  <span>City</span>
                  <input v-model="node.city" class="input" />
                </label>
                <label>
                  <span>Country</span>
                  <input v-model="node.country" class="input" />
                </label>
                <label>
                  <span>Location name</span>
                  <input v-model="node.locationName" class="input" />
                </label>
                <label>
                  <span>Location type</span>
                  <select v-model="node.locationType" class="input">
                    <option v-for="type in locationTypes" :key="type" :value="type">{{ type }}</option>
                  </select>
                </label>
                <label>
                  <span>Transport mode</span>
                  <select v-model="node.transportMode" class="input">
                    <option v-for="mode in transportModes" :key="mode" :value="mode">{{ mode }}</option>
                  </select>
                </label>
                <label>
                  <span>ETA</span>
                  <input v-model="node.eta" class="input" />
                </label>
                <label>
                  <span>Temp range</span>
                  <input v-model="node.tempRange" class="input" />
                </label>
                <label>
                  <span>Actual temp</span>
                  <input v-model="node.actualTemp" class="input" />
                </label>
                <label>
                  <span>Risk score</span>
                  <select v-model="node.riskScore" class="input">
                    <option v-for="risk in riskLevels" :key="risk" :value="risk">{{ risk }}</option>
                  </select>
                </label>
                <label>
                  <span>Validation</span>
                  <select v-model="node.validationStatus" class="input">
                    <option
                      v-for="status in validationStatuses"
                      :key="status"
                      :value="status"
                    >
                      {{ status }}
                    </option>
                  </select>
                </label>
                <label class="editor-node-card__certs">
                  <span>Certifications</span>
                  <input v-model="certificationsMap[node.id]" class="input" />
                </label>
              </div>
            </article>
          </section>
        </div>

        <div class="editor-drawer__footer">
          <button type="button" class="button button--ghost" @click="emit('close')">Cancel</button>
          <button type="button" class="button" @click="handleSave">Save lane</button>
        </div>
      </aside>
    </div>
  </Transition>
</template>
