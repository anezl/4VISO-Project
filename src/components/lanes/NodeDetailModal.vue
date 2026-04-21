<script setup lang="ts">
import type { RouteNode, Requirement } from '@/types/domain'
import StatusPill from '@/components/shared/StatusPill.vue'
import { riskToTone, validationToTone } from '@/types/domain'

interface Props {
  node: RouteNode
  requirement?: Requirement
  open: boolean
}

interface Emits {
  (e: 'close'): void
}

defineProps<Props>()
defineEmits<Emits>()

const fulfillsCertifications = (node: RouteNode, requirement?: Requirement): boolean => {
  if (!requirement) return true
  return requirement.requiredCertifications.every((cert) =>
    node.certifications.includes(cert),
  )
}

const fulfillsCapabilities = (node: RouteNode, requirement?: Requirement): boolean => {
  if (!requirement) return true
  return requirement.requiredCapabilities.every((cap) =>
    node.handlingCapabilities.includes(cap) || node.operationalCapabilities.includes(cap),
  )
}

const meetsSecurityLevel = (node: RouteNode, requirement?: Requirement): boolean => {
  if (!requirement) return true
  const securityLevels = { Standard: 0, Enhanced: 1, 'High Security': 2 }
  return securityLevels[node.securityLevel] >= securityLevels[requirement.securityLevelRequired]
}
</script>

<template>
  <div v-if="open" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <div>
          <h2>{{ node.locationName }}</h2>
          <p class="location-subtitle">{{ node.city }}, {{ node.country }}</p>
        </div>
        <button class="close-button" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <!-- Location & Type -->
        <section class="info-section">
          <h3>Location Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Type</label>
              <p>{{ node.locationType }}</p>
            </div>
            <div class="info-item">
              <label>Transport Mode</label>
              <p>{{ node.transportMode }}</p>
            </div>
            <div class="info-item">
              <label>Security Level</label>
              <StatusPill :label="node.securityLevel" tone="brand" />
            </div>
            <div class="info-item">
              <label>Dwell Time</label>
              <p>{{ node.dwellTime }}</p>
            </div>
          </div>
        </section>

        <!-- Risk & Status -->
        <section class="info-section">
          <h3>Risk & Validation</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Risk Score</label>
              <StatusPill :label="node.riskScore" :tone="riskToTone(node.riskScore)" />
            </div>
            <div class="info-item">
              <label>Validation Status</label>
              <StatusPill :label="node.validationStatus" :tone="validationToTone(node.validationStatus)" />
            </div>
            <div class="info-item">
              <label>Temperature</label>
              <p>{{ node.actualTemp }} (Range: {{ node.tempRange }})</p>
            </div>
          </div>
        </section>

        <!-- Capabilities -->
        <section class="info-section">
          <h3>Capabilities</h3>
          <div class="capabilities-list">
            <div v-if="node.operationalCapabilities.length" class="capability-group">
              <label>Operational</label>
              <div class="tags">
                <span v-for="cap in node.operationalCapabilities" :key="cap" class="tag">
                  {{ cap }}
                </span>
              </div>
            </div>
            <div v-if="node.handlingCapabilities.length" class="capability-group">
              <label>Handling</label>
              <div class="tags">
                <span v-for="cap in node.handlingCapabilities" :key="cap" class="tag">
                  {{ cap }}
                </span>
              </div>
            </div>
            <div v-if="node.monitoringSystems.length" class="capability-group">
              <label>Monitoring</label>
              <div class="tags">
                <span v-for="sys in node.monitoringSystems" :key="sys" class="tag">
                  {{ sys }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- Certifications -->
        <section class="info-section">
          <h3>Certifications</h3>
          <div class="certifications-list">
            <div v-if="node.certifications.length" class="tags">
              <span v-for="cert in node.certifications" :key="cert" class="tag cert-tag">
                ✓ {{ cert }}
              </span>
            </div>
            <p v-else class="no-data">No certifications available</p>
          </div>
        </section>

        <!-- Requirement Fulfillment -->
        <section v-if="requirement" class="info-section requirement-section">
          <h3>Requirement Fulfillment</h3>
          <div class="requirement-checks">
            <div :class="['requirement-check', { fulfilled: fulfillsCertifications(node, requirement) }]">
              <span class="check-icon">{{ fulfillsCertifications(node, requirement) ? '✓' : '✗' }}</span>
              <span>Certifications: {{ fulfillsCertifications(node, requirement) ? 'Met' : 'Missing' }}</span>
            </div>
            <div :class="['requirement-check', { fulfilled: fulfillsCapabilities(node, requirement) }]">
              <span class="check-icon">{{ fulfillsCapabilities(node, requirement) ? '✓' : '✗' }}</span>
              <span>Capabilities: {{ fulfillsCapabilities(node, requirement) ? 'Met' : 'Missing' }}</span>
            </div>
            <div :class="['requirement-check', { fulfilled: meetsSecurityLevel(node, requirement) }]">
              <span class="check-icon">{{ meetsSecurityLevel(node, requirement) ? '✓' : '✗' }}</span>
              <span>Security Level: {{ meetsSecurityLevel(node, requirement) ? 'Met' : 'Insufficient' }}</span>
            </div>
          </div>
        </section>

        <!-- Notes -->
        <section v-if="node.nodeNotes" class="info-section">
          <h3>Notes</h3>
          <p class="notes-text">{{ node.nodeNotes }}</p>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  gap: 16px;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.location-subtitle {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: #6b7280;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s, color 0.2s;
}

.close-button:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.modal-body {
  padding: 24px;
}

.info-section {
  margin-bottom: 24px;
}

.info-section h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  color: #6b7280;
  letter-spacing: 0.5px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item label {
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
}

.info-item p {
  margin: 0;
  font-size: 14px;
  color: #111827;
  font-weight: 500;
}

.capabilities-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.capability-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.capability-group label {
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  display: inline-block;
  background: #f0fdf4;
  color: #166534;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid #86efac;
}

.cert-tag {
  background: #fef3c7;
  color: #a16207;
  border-color: #fde68a;
}

.certifications-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.no-data {
  color: #9ca3af;
  font-size: 14px;
  margin: 0;
}

.requirement-section {
  background: #f9fafb;
  padding: 16px;
  border-radius: 6px;
}

.requirement-checks {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.requirement-check {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border-left: 3px solid #ef4444;
  font-size: 14px;
  color: #dc2626;
}

.requirement-check.fulfilled {
  border-left-color: #22c55e;
  color: #16a34a;
}

.check-icon {
  font-weight: 600;
  font-size: 16px;
}

.notes-text {
  margin: 0;
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
}
</style>
