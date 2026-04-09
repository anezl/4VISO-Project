<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import { roleDescriptions, roleLabels, type RegistrationPayload, type UserRole } from '@/types/domain'

const authStore = useAuthStore()
const router = useRouter()

const form = reactive<RegistrationPayload>({
  role: 'ordinary_user',
  fullName: '',
  email: '',
  password: '',
  companyName: '',
  country: '',
  phone: '',
})

const isSubmitting = ref(false)
const errorMessage = ref('')

const roles: UserRole[] = [
  'ordinary_user',
  'pharma_company',
  'logistics_provider',
  'auditor_qa',
  'admin',
]

const requiresBusinessFields = computed(() => form.role !== 'ordinary_user')

async function handleSubmit() {
  try {
    isSubmitting.value = true
    errorMessage.value = ''
    await authStore.register(form)
    await router.push({
      name: 'email-verified',
      query: {
        email: form.email,
      },
    })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to register the account.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="auth-page auth-page--compact">
    <section class="auth-hero">
      <p class="auth-hero__eyebrow">Role-based onboarding</p>
      <h1>Create a 4VISO workspace account.</h1>
      <p class="auth-hero__copy">
        Keep the first step short and simple. Roles shape what users can view, edit, or validate later in the product.
      </p>

      <div class="role-grid">
        <article v-for="role in roles" :key="role" class="role-card">
          <strong>{{ roleLabels[role] }}</strong>
          <p>{{ roleDescriptions[role] }}</p>
        </article>
      </div>
    </section>

    <section class="auth-card auth-card--wide">
      <p class="auth-card__eyebrow">Registration</p>
      <h2>Create your account</h2>

      <form class="auth-form auth-form--grid" @submit.prevent="handleSubmit">
        <label>
          <span>Role</span>
          <select v-model="form.role" class="input">
            <option v-for="role in roles" :key="role" :value="role">
              {{ roleLabels[role] }}
            </option>
          </select>
        </label>

        <label>
          <span>Full name</span>
          <input v-model="form.fullName" class="input" placeholder="Your full name" />
        </label>

        <label>
          <span>Email</span>
          <input v-model="form.email" type="email" class="input" placeholder="name@company.com" />
        </label>

        <label>
          <span>Password</span>
          <input
            v-model="form.password"
            type="password"
            class="input"
            placeholder="Create a password"
          />
        </label>

        <template v-if="requiresBusinessFields">
          <label>
            <span>Company</span>
            <input v-model="form.companyName" class="input" placeholder="Company name" />
          </label>

          <label>
            <span>Country</span>
            <input v-model="form.country" class="input" placeholder="Country" />
          </label>

          <label>
            <span>Phone</span>
            <input v-model="form.phone" class="input" placeholder="+32 000 000 000" />
          </label>
        </template>

        <p v-if="errorMessage" class="form-error form-error--full">{{ errorMessage }}</p>

        <button type="submit" class="button button--wide" :disabled="isSubmitting">
          {{ isSubmitting ? 'Creating account...' : 'Create account' }}
        </button>
      </form>

      <div class="auth-card__links">
        <RouterLink :to="{ name: 'login' }">Back to login</RouterLink>
      </div>
    </section>
  </div>
</template>
