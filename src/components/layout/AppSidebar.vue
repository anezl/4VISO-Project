<script setup lang="ts">
import {
  Bell,
  Boxes,
  CircleHelp,
  FileBadge2,
  LogOut,
  ShieldCheck,
  UserRound,
} from 'lucide-vue-next'
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import StatusPill from '@/components/shared/StatusPill.vue'
import { useAuthStore } from '@/stores/auth'
import { roleLabels, roleToTone } from '@/types/domain'

const authStore = useAuthStore()
const router = useRouter()

const navigationItems = computed(() => [
  {
    label: 'Lane',
    routeName: 'shipments',
    icon: Boxes,
  },
  {
    label: 'Notifications',
    routeName: 'notifications',
    icon: Bell,
  },
  {
    label: 'Certificates',
    routeName: 'certificates',
    icon: FileBadge2,
  },
  {
    label: 'Profile',
    routeName: 'profile',
    icon: UserRound,
  },
])

async function handleLogout() {
  await authStore.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar__brand">
      <div class="brand-mark">4</div>

      <div>
        <p class="sidebar__eyebrow">Compliance made seamless</p>
        <h1>4VISO</h1>
      </div>
    </div>

    <div class="sidebar__workspace">
      <p class="sidebar__eyebrow">Workspace</p>
      <p class="sidebar__workspace-title">Lane visibility cockpit</p>
      <p class="sidebar__workspace-copy">
        Build lanes, compare routes, and track report status in one place.
      </p>
    </div>

    <div v-if="authStore.currentUser" class="sidebar__user-card">
      <div>
        <p class="sidebar__user-name">{{ authStore.currentUser.fullName }}</p>
        <p class="sidebar__user-email">{{ authStore.currentUser.email }}</p>
      </div>

      <StatusPill
        :label="roleLabels[authStore.currentUser.role]"
        :tone="roleToTone(authStore.currentUser.role)"
      />
    </div>

    <nav class="sidebar__nav">
      <RouterLink
        v-for="item in navigationItems"
        :key="item.routeName"
        :to="{ name: item.routeName }"
        class="sidebar__nav-link"
      >
        <component :is="item.icon" :size="18" />
        <span>{{ item.label }}</span>
      </RouterLink>

      <RouterLink
        v-if="authStore.isAdmin"
        :to="{ name: 'admin' }"
        class="sidebar__nav-link"
      >
        <ShieldCheck :size="18" />
        <span>Admin</span>
      </RouterLink>
    </nav>

    <div class="sidebar__shortcut-group">
      <RouterLink :to="{ name: 'role-guide' }" class="sidebar__quick-link">
        <CircleHelp :size="18" />
        <span>Role guide</span>
      </RouterLink>
    </div>

    <button type="button" class="sidebar__logout" @click="handleLogout">
      <LogOut :size="18" />
      <span>Sign out</span>
    </button>
  </aside>
</template>
