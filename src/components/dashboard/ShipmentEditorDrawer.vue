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

function syncRouteMetadata(shipment: Shipment) {
  shipment.originCity = shipment.routeNodes[0]?.city ?? shipment.originCity
  shipment.destinationCity =
    shipment.routeNodes[shipment.routeNodes.length - 1]?.city ?? shipment.destinationCity
  shipment.progress = Math.min(100, Math.max(0, shipment.progress))
}

watch(
  () => props.shipment,
  (nextShipment) => {
    syncForm(nextShipment)
  },
  { immediate: true },
)

const canRemoveNode = computed(() => (form.value?.routeNodes.length ?? 0) > 2)
const routePreview = computed(() => form.value?.routeNodes.map((node) => node.city).join(' -> ') ?? '')
const validationSummary = computed(() => {
  if (!form.value) {
    return '0 validated'
  }

  const validated = form.value.routeNodes.filter((node) => node.validationStatus === 'Validated').length
  const pending = form.value.routeNodes.filter((node) => node.validationStatus === 'Pending').length
  const rejected = form.value.routeNodes.filter((node) => node.validationStatus === 'Rejected').length

  return `${validated} validated / ${pending} pending / ${rejected} rejected`
})

function nodeStageLabel(index: number, total: number) {
  if (index === 0) {
    return 'Origin'
  }

  if (index === total - 1) {
    return 'Destination'
  }

  return 'Transit'
}

function addNode() {
  if (!form.value) {
    return
  }

  const nodeId = generateId('node')
  const insertAt = Math.max(form.value.routeNodes.length - 1, 1)
  const anchorNode = form.value.routeNodes[insertAt - 1] ?? form.value.routeNodes[0]

  form.value.routeNodes.splice(insertAt, 0, {
    id: nodeId,
    city: 'New city',
    country: anchorNode?.country ?? 'Country',
    locationName: 'Transit checkpoint',
    locationType: 'Hub',
    transportMode: anchorNode?.transportMode ?? 'Road',
    eta: 'TBD',
    tempRange: form.value.requiredTempRange,
    actualTemp: form.value.actualAverageTemp,
    riskScore: 'Medium',
    certifications: ['EU GDP'],
    validationStatus: 'Pending',
  })

  certificationsMap.value[nodeId] = 'EU GDP'
}

function duplicateNode(nodeId: string) {
  if (!form.value) {
    return
  }

  const nodeIndex = form.value.routeNodes.findIndex((node) => node.id === nodeId)

  if (nodeIndex === -1) {
    return
  }

  const sourceNode = form.value.routeNodes[nodeIndex]
  const duplicateId = generateId('node')

  form.value.routeNodes.splice(nodeIndex + 1, 0, {
    ...structuredClone(sourceNode),
    id: duplicateId,
    locationName: `${sourceNode.locationName} Copy`,
  })

  certificationsMap.value[duplicateId] = certificationsMap.value[nodeId] ?? sourceNode.certifications.join(', ')
}

function moveNode(nodeId: string, direction: 'up' | 'down') {
  if (!form.value) {
    return
  }

  const nodeIndex = form.value.routeNodes.findIndex((node) => node.id === nodeId)

  if (nodeIndex === -1) {
    return
  }

  const swapIndex = direction === 'up' ? nodeIndex - 1 : nodeIndex + 1

  if (swapIndex < 0 || swapIndex >= form.value.routeNodes.length) {
    return
  }

  const nextNodes = [...form.value.routeNodes]
  const currentNode = nextNodes[nodeIndex]

  nextNodes[nodeIndex] = nextNodes[swapIndex]
  nextNodes[swapIndex] = currentNode
  form.value.routeNodes = nextNodes
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

  syncRouteMetadata(form.value)
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
            <div class="section-heading">
              <div>
                <p class="section-heading__eyebrow">Route preview</p>
                <h4>{{ routePreview }}</h4>
              </div>
            </div>

            <div class="editor-summary-grid">
              <article class="editor-summary-card">
                <p>Nodes</p>
                <strong>{{ form.routeNodes.length }}</strong>
              </article>
              <article class="editor-summary-card">
                <p>Validation</p>
                <strong>{{ validationSummary }}</strong>
              </article>
              <article class="editor-summary-card">
                <p>Temperature</p>
                <strong>{{ form.requiredTempRange }}</strong>
              </article>
            </div>
          </section>

          <section class="editor-drawer__section">
            <div class="section-heading">
              <div>
                <p class="section-heading__eyebrow">Lane details</p>
                <h4>Shipment level information</h4>
              </div>
            </div>

            <div class="editor-form-grid">
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
            </div>
          </section>

          <section class="editor-drawer__section">
            <div class="editor-drawer__section-header">
              <div>
                <p class="section-heading__eyebrow">Nodes</p>
                <h4>Stops and transport handovers</h4>
              </div>

              <button type="button" class="button button--secondary" @click="addNode">
                Add transit node
              </button>
            </div>

            <article
              v-for="(node, index) in form.routeNodes"
              :key="node.id"
              class="editor-node-card"
            >
              <div class="editor-node-card__header">
                <div>
                  <p class="section-heading__eyebrow">
                    Node {{ index + 1 }} - {{ nodeStageLabel(index, form.routeNodes.length) }}
                  </p>
                  <h5>{{ node.city }}, {{ node.country }}</h5>
                </div>

                <div class="editor-node-card__actions">
                  <button
                    type="button"
                    class="button button--ghost"
                    :disabled="index === 0"
                    @click="moveNode(node.id, 'up')"
                  >
                    Move up
                  </button>
                  <button
                    type="button"
                    class="button button--ghost"
                    :disabled="index === form.routeNodes.length - 1"
                    @click="moveNode(node.id, 'down')"
                  >
                    Move down
                  </button>
                  <button
                    type="button"
                    class="button button--ghost"
                    @click="duplicateNode(node.id)"
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    class="button button--ghost"
                    :disabled="!canRemoveNode"
                    @click="removeNode(node.id)"
                  >
                    Remove
                  </button>
                </div>
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
