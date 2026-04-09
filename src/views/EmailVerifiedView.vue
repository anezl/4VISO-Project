<script setup lang="ts">
import { CheckCheck } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { mockApi } from '@/services/mockApi'

const route = useRoute()
const router = useRouter()
const email = computed(() => (typeof route.query.email === 'string' ? route.query.email : ''))
const isSubmitting = ref(false)
const errorMessage = ref('')

async function handleVerify() {
  if (!email.value) {
    await router.push({ name: 'login' })
    return
  }

  try {
    isSubmitting.value = true
    errorMessage.value = ''
    await mockApi.verifyUserEmail(email.value)
    await router.push({
      name: 'login',
      query: {
        verified: '1',
      },
    })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to verify email.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="auth-page auth-page--single">
    <section class="auth-card">
      <div class="success-banner success-banner--large">
        <CheckCheck :size="20" />
        <span>Demo verification ready</span>
      </div>

      <p class="auth-card__eyebrow">Email verification</p>
      <h2>Verify your account</h2>
      <p class="auth-card__copy">
        This mock step marks <strong>{{ email || 'your email' }}</strong> as verified so the login flow behaves like a real app.
      </p>

      <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

      <button type="button" class="button button--wide" :disabled="isSubmitting" @click="handleVerify">
        {{ isSubmitting ? 'Verifying...' : 'Verify and continue' }}
      </button>

      <div class="auth-card__links">
        <RouterLink :to="{ name: 'login' }">Back to login</RouterLink>
      </div>
    </section>
  </div>
</template>
