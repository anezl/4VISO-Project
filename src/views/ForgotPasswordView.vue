<script setup lang="ts">
import { MailCheck } from 'lucide-vue-next'
import { ref } from 'vue'

import { mockApi } from '@/services/mockApi'

const email = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

async function handleSubmit() {
  isSubmitting.value = true
  const response = await mockApi.requestPasswordReset(email.value)
  successMessage.value = response.message
  isSubmitting.value = false
}
</script>

<template>
  <div class="auth-page auth-page--single">
    <section class="auth-card">
      <p class="auth-card__eyebrow">Password reset</p>
      <h2>Forgot your password?</h2>
      <p class="auth-card__copy">
        Enter your email and we will simulate a reset flow for the MVP.
      </p>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <label>
          <span>Email</span>
          <input v-model="email" type="email" class="input" placeholder="name@company.com" />
        </label>

        <button type="submit" class="button button--wide" :disabled="isSubmitting">
          {{ isSubmitting ? 'Sending reset...' : 'Send reset link' }}
        </button>
      </form>

      <div v-if="successMessage" class="success-banner">
        <MailCheck :size="18" />
        <span>{{ successMessage }}</span>
      </div>

      <div class="auth-card__links">
        <RouterLink :to="{ name: 'login' }">Back to login</RouterLink>
      </div>
    </section>
  </div>
</template>
