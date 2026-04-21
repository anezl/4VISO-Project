<script setup lang="ts">
import { ref, computed, getCurrentInstance } from 'vue'
import type { Lane, Requirement, RouteNode } from '@/types/domain'
import NodeDetailModal from '@/components/lanes/NodeDetailModal.vue'
import TransportationSegmentDetail from '@/components/lanes/TransportationSegmentDetail.vue'
import StatusPill from '@/components/shared/StatusPill.vue'
import { riskToTone } from '@/types/domain'

interface Props {
  lane: Lane
  requirement?: Requirement
  editable?: boolean
}

interface Emits {
  (e: 'update', lane: Lane): void
  (e: 'add-node'): void
}

const props = withDefaults(defineProps<Props>(), {
  editable: false,
})

const emit = defineEmits<Emits>()

const selectedNodeId = ref<string | null>(null)
const hoveredSegmentId = ref<string | null>(null)
const editableNodes = ref<RouteNode[]>([...props.lane.nodes])
const draggedNodeId = ref<string | null>(null)

const selectedNode = computed(() => {
  return selectedNodeId.value
    ? editableNodes.value.find((n) => n.id === selectedNodeId.value)
    : null
})

const getNodeAlertCount = (nodeId: string): number => {
  return props.lane.transportationSegments.reduce((count, seg) => {
    if (seg.fromNodeId === nodeId || seg.toNodeId === nodeId) {
      return count + seg.alerts.filter((a) => a.isActive).length
    }
    return count
  }, 0)
}

const handleDragStart = (nodeId: string) => {
  if (props.editable) {
    draggedNodeId.value = nodeId
  }
}

const handleDragOver = (e: DragEvent) => {
  if (props.editable) {
    e.preventDefault()
  }
}

const handleDrop = (index: number) => {
  if (!props.editable || !draggedNodeId.value) return

  const draggedIndex = editableNodes.value.findIndex((n) => n.id === draggedNodeId.value)
  if (draggedIndex === -1) return

  const [draggedNode] = editableNodes.value.splice(draggedIndex, 1)
  editableNodes.value.splice(index, 0, draggedNode)
  draggedNodeId.value = null

  // Emit update
  const updatedLane = { ...props.lane, nodes: editableNodes.value }
  emit('update', updatedLane)
}

const removeNode = (nodeId: string) => {
  if (!props.editable) return
  editableNodes.value = editableNodes.value.filter((n) => n.id !== nodeId)
  const updatedLane = { ...props.lane, nodes: editableNodes.value }
  emit('update', updatedLane)
}
</script>

<template>
  <div class="lane-flow-container">
    <div class="flow-header">
      <div>
        <h3>{{ lane.originCity }} → {{ lane.destinationCity }}</h3>
        <p class="flow-meta">{{ editableNodes.length }} nodes • {{ lane.transportationSegments.length }} segments</p>
      </div>
      <div class="header-actions">
        <StatusPill :label="`Risk: ${lane.overallRisk}`" :tone="riskToTone(lane.overallRisk)" />
        <span v-if="editable" class="edit-badge">Edit Mode</span>
      </div>
    </div>

    <div class="flow-diagram">
      <!-- Nodes and Segments -->
      <div class="flow-items">
        <div
          v-for="(node, index) in editableNodes"
          :key="node.id"
          class="flow-item-group"
          :class="{ 'drag-over': draggedNodeId !== null }"
          @dragover="handleDragOver"
          @drop="handleDrop(index)"
        >
          <!-- Node -->
          <div
            :class="['node', { selected: selectedNodeId === node.id, editable: props.editable }]"
            :draggable="props.editable"
            @click="selectedNodeId = selectedNodeId === node.id ? null : node.id"
            @dragstart="handleDragStart(node.id)"
          >
            <div class="node-header">
              <span class="node-number">{{ index + 1 }}</span>
              <span v-if="getNodeAlertCount(node.id)" class="node-alert-badge">
                {{ getNodeAlertCount(node.id) }}
              </span>
              <button
                v-if="props.editable && editableNodes.length > 1"
                class="remove-button"
                @click.stop="removeNode(node.id)"
              >
                ✕
              </button>
            </div>
            <div class="node-content">
              <p class="node-city">{{ node.city }}</p>
              <p class="node-type">{{ node.locationType }}</p>
            </div>
          </div>

          <!-- Transportation Segment -->
          <div v-if="index < editableNodes.length - 1" class="segment-connector">
            <TransportationSegmentDetail
              :segment="lane.transportationSegments[index]"
              :on-hover="hoveredSegmentId === lane.transportationSegments[index].id"
              @mouseenter="hoveredSegmentId = lane.transportationSegments[index].id"
              @mouseleave="hoveredSegmentId = null"
              @details="hoveredSegmentId = lane.transportationSegments[index].id"
            />
          </div>
        </div>

        <!-- Add Node Button (in edit mode) -->
        <div v-if="props.editable" class="add-node-button">
          <button @click="emit('add-node')">+ Add Node</button>
        </div>
      </div>
    </div>

    <!-- Node Detail Modal -->
    <NodeDetailModal
      v-if="selectedNode"
      :node="selectedNode"
      :requirement="requirement"
      :open="selectedNodeId !== null"
      @close="selectedNodeId = null"
    />
  </div>
</template>

<style scoped>
.lane-flow-container {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 20px;
  margin-bottom: 16px;
}

.flow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.flow-header h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.flow-meta {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.edit-badge {
  background: #fef3c7;
  color: #a16207;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.flow-diagram {
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 8px;
}

.flow-items {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  min-width: min-content;
}

.flow-item-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.flow-item-group.drag-over {
  opacity: 0.5;
}

.node {
  flex: 0 0 140px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.node.editable {
  cursor: move;
}

.node:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

.node.selected {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  position: relative;
}

.node-number {
  width: 24px;
  height: 24px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.node-alert-badge {
  width: 24px;
  height: 24px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
}

.remove-button {
  width: 20px;
  height: 20px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 3px;
  color: #dc2626;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  margin-left: auto;
}

.remove-button:hover {
  background: #fecaca;
  border-color: #f87171;
}

.node-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.node-city {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.node-type {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.segment-connector {
  display: flex;
  align-items: center;
}

.add-node-button {
  display: flex;
  align-items: center;
}

.add-node-button button {
  background: #f0fdf4;
  border: 2px dashed #86efac;
  border-radius: 6px;
  padding: 12px 16px;
  color: #166534;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-node-button button:hover {
  background: #dcfce7;
  border-color: #22c55e;
}
</style>
