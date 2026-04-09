<script setup lang="ts">
import { ArrowRight, ShieldCheck } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import StatusPill from '@/components/shared/StatusPill.vue'
import { demoAccessShowcase } from '@/mocks/seed'
import { useAuthStore } from '@/stores/auth'
import { roleLabels, roleToTone } from '@/types/domain'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('admin@4viso.com')
const password = ref('demo123')
const errorMessage = ref('')
const isSubmitting = ref(false)

function fillDemo(emailValue: string) {
  email.value = emailValue
  password.value = 'demo123'
}

async function handleSubmit() {
  try {
    isSubmitting.value = true
    errorMessage.value = ''
    await authStore.login({
      email: email.value,
      password: password.value,
    })

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/shipments'
    await router.push(redirect)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to sign in.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <section class="auth-hero">
      <p class="auth-hero__eyebrow">4VISO product UI</p>
      <h1>Lane visibility for pharmaceutical logistics.</h1>
      <p class="auth-hero__copy">
        Sign in to inspect route risk, node validations, certifications, and live operational alerts.
      </p>

      <div class="auth-hero__panel">
        <div class="auth-hero__panel-header">
          <ShieldCheck :size="18" />
          <span>Demo access</span>
        </div>

        <div class="auth-hero__accounts">
          <button
            v-for="account in demoAccessShowcase"
            :key="account.email"
            type="button"
            class="demo-account"
            @click="fillDemo(account.email)"
          >
            <div>
              <strong>{{ account.fullName }}</strong>
              <p>{{ account.email }}</p>
            </div>

            <div class="demo-account__meta">
              <StatusPill
                :label="roleLabels[account.role]"
                :tone="roleToTone(account.role)"
              />
              <span>Password: {{ account.password }}</span>
            </div>
          </button>
        </div>
      </div>
    </section>

    <section class="auth-card">
      <p class="auth-card__eyebrow">Welcome back</p>
      <h2>Log in to your workspace</h2>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <label>
          <span>Email</span>
          <input v-model="email" type="email" class="input" placeholder="name@company.com" />
        </label>

        <label>
          <span>Password</span>
          <input v-model="password" type="password" class="input" placeholder="Enter your password" />
        </label>

        <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

        <button type="submit" class="button button--wide" :disabled="isSubmitting">
          <span>{{ isSubmitting ? 'Signing in...' : 'Log in' }}</span>
          <ArrowRight :size="16" />
        </button>
      </form>

      <div class="auth-card__links">
        <RouterLink :to="{ name: 'forgot-password' }">Forgot password?</RouterLink>
        <RouterLink :to="{ name: 'register' }">Create an account</RouterLink>
      </div>
    </section>
  </div>
</template>
