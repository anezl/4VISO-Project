<script setup lang="ts">
import type { TransportationSegment, AlertItem } from '@/types/domain'

interface Props {
  segment: TransportationSegment
  onHover?: boolean
}

interface Emits {
  (e: 'details'): void
}

defineProps<Props>()
defineEmits<Emits>()

const criticalAlerts = (alerts: AlertItem[]) => alerts.filter((a) => a.severity === 'High' || a.severity === 'Critical')
const warningAlerts = (alerts: AlertItem[]) => alerts.filter((a) => a.severity === 'Medium')
const infoAlerts = (alerts: AlertItem[]) => alerts.filter((a) => a.severity === 'Low')
</script>

<template>
  <div :class="['transportation-segment', { 'hover-active': onHover }]">
    <div class="segment-header">
      <div class="mode-info">
        <span class="transport-mode">{{ segment.transportMode }}</span>
        <span class="duration">{{ segment.estimatedDurationHours }}h</span>
      </div>
      <button class="details-button" @click="$emit('details')">
        <span>+</span>
      </button>
    </div>

    <div class="segment-details">
      <p class="company-name">{{ segment.logisticsCompanyName }}</p>
      
      <div v-if="segment.alerts.length" class="alerts-summary">
        <div v-if="criticalAlerts(segment.alerts).length" class="alert-badge critical">
          {{ criticalAlerts(segment.alerts).length }}
        </div>
        <div v-if="warningAlerts(segment.alerts).length" class="alert-badge warning">
          {{ warningAlerts(segment.alerts).length }}
        </div>
        <div v-if="infoAlerts(segment.alerts).length" class="alert-badge info">
          {{ infoAlerts(segment.alerts).length }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.transportation-segment {
  flex: 0 0 120px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s ease;
}

.transportation-segment.hover-active {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.segment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.mode-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.transport-mode {
  font-size: 12px;
  font-weight: 600;
  color: #1f2937;
  text-transform: uppercase;
}

.duration {
  font-size: 11px;
  color: #6b7280;
}

.details-button {
  width: 24px;
  height: 24px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #f9fafb;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.details-button:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #111827;
}

.segment-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.company-name {
  font-size: 11px;
  font-weight: 500;
  color: #374151;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alerts-summary {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.alert-badge {
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: white;
}

.alert-badge.critical {
  background: #ef4444;
}

.alert-badge.warning {
  background: #f59e0b;
}

.alert-badge.info {
  background: #3b82f6;
}
</style>
