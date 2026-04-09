<script setup lang="ts">
import { computed, onMounted } from 'vue'

import StatusPill from '@/components/shared/StatusPill.vue'
import { useShipmentsStore } from '@/stores/shipments'
import { useWorkspaceStore } from '@/stores/workspace'
import { roleLabels, roleToTone, validationToTone } from '@/types/domain'

const shipmentsStore = useShipmentsStore()
const workspaceStore = useWorkspaceStore()

onMounted(async () => {
  await Promise.all([shipmentsStore.loadShipments(), workspaceStore.loadWorkspace()])
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
        <h1>Users and validation backlog</h1>
        <p class="hero-card__copy">
          Lightweight admin oversight for the MVP: user roster, route exceptions, and non-validated nodes.
        </p>
      </div>
    </section>

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
</template>
