<script setup lang="ts">
import { computed } from 'vue'

import StatusPill from '@/components/shared/StatusPill.vue'
import { useAuthStore } from '@/stores/auth'
import { roleDescriptions, roleLabels, roleToTone } from '@/types/domain'

const authStore = useAuthStore()

const capabilityBlocks = computed(() => [
  {
    title: 'Route editing',
    value: authStore.canEditRoutes ? 'Enabled' : 'Read only',
  },
  {
    title: 'Compliance approval',
    value: authStore.canApproveCompliance ? 'Enabled' : 'View only',
  },
  {
    title: 'Admin surface',
    value: authStore.isAdmin ? 'Enabled' : 'Unavailable',
  },
])
</script>

<template>
  <div class="page-section" v-if="authStore.currentUser">
    <section class="hero-card">
      <div>
        <p class="section-heading__eyebrow">User profile</p>
        <h1>{{ authStore.currentUser.fullName }}</h1>
        <p class="hero-card__copy">{{ authStore.currentUser.email }}</p>
      </div>

      <StatusPill
        :label="roleLabels[authStore.currentUser.role]"
        :tone="roleToTone(authStore.currentUser.role)"
      />
    </section>

    <section class="page-grid">
      <article class="panel-card">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Profile details</p>
            <h3>Account snapshot</h3>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-card">
            <p>Company</p>
            <strong>{{ authStore.currentUser.companyName ?? 'Independent user' }}</strong>
          </div>
          <div class="detail-card">
            <p>Country</p>
            <strong>{{ authStore.currentUser.country ?? 'Not set' }}</strong>
          </div>
          <div class="detail-card">
            <p>Phone</p>
            <strong>{{ authStore.currentUser.phone ?? 'Not set' }}</strong>
          </div>
          <div class="detail-card">
            <p>Email status</p>
            <strong>{{ authStore.currentUser.emailVerified ? 'Verified' : 'Pending verification' }}</strong>
          </div>
        </div>
      </article>

      <article class="panel-card">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Role behavior</p>
            <h3>Capabilities in this MVP</h3>
          </div>
        </div>

        <p class="panel-card__copy">{{ roleDescriptions[authStore.currentUser.role] }}</p>

        <div class="stack-list stack-list--compact">
          <article v-for="capability in capabilityBlocks" :key="capability.title" class="stack-item">
            <div class="stack-item__row">
              <strong>{{ capability.title }}</strong>
              <span>{{ capability.value }}</span>
            </div>
          </article>
        </div>
      </article>
    </section>
  </div>
</template>
