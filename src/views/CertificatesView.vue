<script setup lang="ts">
import { computed, onMounted } from 'vue'

import StatusPill from '@/components/shared/StatusPill.vue'
import { useShipmentsStore } from '@/stores/shipments'
import { formatDate } from '@/utils/formatters'

const shipmentsStore = useShipmentsStore()

onMounted(async () => {
  await shipmentsStore.loadShipments()
})

const certificates = computed(() => shipmentsStore.allCertificates)
</script>

<template>
  <div class="page-section">
    <section class="hero-card">
      <div>
        <p class="section-heading__eyebrow">Compliance library</p>
        <h1>Certificates across all shipment lanes</h1>
        <p class="hero-card__copy">
          A lightweight overview of certification health, expiry exposure, and lane-level compliance evidence.
        </p>
      </div>
    </section>

    <section class="certificate-grid">
      <article
        v-for="certificate in certificates"
        :key="certificate.id"
        class="panel-card certificate-card"
      >
        <div class="stack-item__row">
          <div>
            <p class="section-heading__eyebrow">{{ certificate.scope }}</p>
            <h3>{{ certificate.name }}</h3>
          </div>

          <StatusPill
            :label="certificate.status"
            :tone="certificate.status === 'Valid' ? 'validated' : certificate.status === 'Expired' ? 'rejected' : 'pending'"
          />
        </div>

        <div class="stack-list stack-list--compact">
          <div class="detail-card">
            <p>Issuer</p>
            <strong>{{ certificate.issuer }}</strong>
          </div>
          <div class="detail-card">
            <p>Valid until</p>
            <strong>{{ formatDate(certificate.validUntil) }}</strong>
          </div>
          <div class="detail-card">
            <p>Shipment</p>
            <strong>{{ certificate.shipmentId }}</strong>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>
