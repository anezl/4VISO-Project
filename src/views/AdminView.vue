<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import StatusPill from '@/components/shared/StatusPill.vue'
import LaneCreation from '@/components/lanes/LaneCreation.vue'
import { useShipmentsStore } from '@/stores/shipments'
import { useWorkspaceStore } from '@/stores/workspace'
import { useLanesStore } from '@/stores/lanes'
import { roleLabels, roleToTone, validationToTone } from '@/types/domain'

const shipmentsStore = useShipmentsStore()
const workspaceStore = useWorkspaceStore()
const lanesStore = useLanesStore()

const activeTab = ref<'overview' | 'lanes'>('overview')

onMounted(async () => {
  await Promise.all([
    shipmentsStore.loadShipments(),
    workspaceStore.loadWorkspace(),
    lanesStore.loadLanes(),
    lanesStore.loadRequirements(),
  ])
})

const pendingNodes = computed(() =>
  shipmentsStore.shipments.flatMap((shipment) =>
    shipment.routeNodes
      .filter((node) => node.validationStatus !== 'Validated')
      .map((node) => ({
        shipmentReference: shipment.reference,
        shipmentTitle: shipment.title,
        node,
      })),
  ),
)
</script>

<template>
  <div class="page-section">
    <section class="hero-card">
      <div>
        <p class="section-heading__eyebrow">Admin workspace</p>
        <h1>Users, validation & lane management</h1>
        <p class="hero-card__copy">
          Manage workspace users, review validation backlog, and create or analyze transport lanes.
        </p>
      </div>
    </section>

    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <button
        :class="['tab-button', { active: activeTab === 'overview' }]"
        @click="activeTab = 'overview'"
      >
        Overview
      </button>
      <button
        :class="['tab-button', { active: activeTab === 'lanes' }]"
        @click="activeTab = 'lanes'"
      >
        Lane Management
      </button>
    </div>

    <!-- Overview Tab -->
    <div v-if="activeTab === 'overview'" class="tab-content">
      <section class="page-grid">
        <article class="panel-card">
          <div class="section-heading">
            <div>
              <p class="section-heading__eyebrow">Users</p>
              <h3>Workspace members</h3>
            </div>
          </div>

          <div class="stack-list">
            <article v-for="user in workspaceStore.users" :key="user.id" class="stack-item">
              <div class="stack-item__row">
                <div>
                  <strong>{{ user.fullName }}</strong>
                  <p>{{ user.email }}</p>
                </div>

                <StatusPill :label="roleLabels[user.role]" :tone="roleToTone(user.role)" />
              </div>
            </article>
          </div>
        </article>

        <article class="panel-card">
          <div class="section-heading">
            <div>
              <p class="section-heading__eyebrow">Validation queue</p>
              <h3>Nodes requiring attention</h3>
            </div>
          </div>

          <div class="stack-list">
            <article
              v-for="item in pendingNodes"
              :key="`${item.shipmentReference}-${item.node.id}`"
              class="stack-item"
            >
              <div class="stack-item__row">
                <div>
                  <strong>{{ item.node.locationName }}</strong>
                  <p>{{ item.shipmentReference }} • {{ item.shipmentTitle }}</p>
                </div>

                <StatusPill
                  :label="item.node.validationStatus"
                  :tone="validationToTone(item.node.validationStatus)"
                />
              </div>

              <p>{{ item.node.city }}, {{ item.node.country }} • {{ item.node.transportMode }}</p>
            </article>
          </div>
        </article>
      </section>
    </div>

    <!-- Lanes Tab -->
    <div v-if="activeTab === 'lanes'" class="tab-content">
      <LaneCreation v-if="lanesStore.lanes.length" :lanes="lanesStore.lanes" :requirements="lanesStore.requirements" />
      <div v-else class="empty-state">
        <p>Loading lane data...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tab-navigation {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.tab-button {
  padding: 12px 16px;
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  margin-bottom: -1px;
}

.tab-button:hover {
  color: #374151;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-content {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
}
</style>
