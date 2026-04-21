import { createRouter, createWebHistory } from 'vue-router'

import AppShell from '@/components/layout/AppShell.vue'
import { pinia } from '@/plugins/pinia'
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/types/domain'
import AdminView from '@/views/AdminView.vue'
import CertificatesView from '@/views/CertificatesView.vue'
import DashboardView from '@/views/DashboardView.vue'
import EmailVerifiedView from '@/views/EmailVerifiedView.vue'
import ForgotPasswordView from '@/views/ForgotPasswordView.vue'
import LoginView from '@/views/LoginView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import NotificationsView from '@/views/NotificationsView.vue'
import ProfileView from '@/views/ProfileView.vue'
import RegisterView from '@/views/RegisterView.vue'
import RoleGuideView from '@/views/RoleGuideView.vue'
import ShipmentsView from '@/views/ShipmentsView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    guestOnly?: boolean
    title?: string
    roles?: UserRole[]
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: { name: 'shipments' },
    },
    {
      path: '/auth/login',
      name: 'login',
      component: LoginView,
      meta: {
        guestOnly: true,
        title: 'Log In',
      },
    },
    {
      path: '/auth/register',
      name: 'register',
      component: RegisterView,
      meta: {
        guestOnly: true,
        title: 'Register',
      },
    },
    {
      path: '/auth/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView,
      meta: {
        guestOnly: true,
        title: 'Forgot Password',
      },
    },
    {
      path: '/auth/email-verified',
      name: 'email-verified',
      component: EmailVerifiedView,
      meta: {
        guestOnly: true,
        title: 'Verify Email',
      },
    },
    {
      path: '/',
      component: AppShell,
      meta: {
        requiresAuth: true,
      },
      children: [
        {
          path: 'lanes',
          name: 'shipments',
          component: ShipmentsView,
          meta: {
            title: 'Lane',
          },
        },
        {
          path: 'lane/:shipmentId',
          name: 'lane',
          component: DashboardView,
          meta: {
            title: 'Lane',
          },
        },
        {
          path: 'dashboard/:shipmentId',
          redirect: (to) => ({
            name: 'lane',
            params: to.params,
            query: to.query,
          }),
        },
        {
          path: 'notifications',
          name: 'notifications',
          component: NotificationsView,
          meta: {
            title: 'Notifications',
          },
        },
        {
          path: 'certificates',
          name: 'certificates',
          component: CertificatesView,
          meta: {
            title: 'Certificates',
          },
        },
        {
          path: 'profile',
          name: 'profile',
          component: ProfileView,
          meta: {
            title: 'Profile',
          },
        },
        {
          path: 'role-guide',
          name: 'role-guide',
          component: RoleGuideView,
          meta: {
            title: 'Role Guide',
          },
        },
        {
          path: 'admin',
          name: 'admin',
          component: AdminView,
          meta: {
            title: 'Admin',
            roles: ['admin'],
          },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
      meta: {
        title: 'Page Not Found',
      },
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore(pinia)
  await authStore.initializeSession()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: 'shipments' }
  }

  if (to.meta.roles?.length && (!authStore.currentUser || !to.meta.roles.includes(authStore.currentUser.role))) {
    return { name: 'shipments' }
  }

  return true
})
