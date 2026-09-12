import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import axios from 'axios'
import { API_BASE_URL } from '@/config/api'
import { clearAdminSession, saveAdminProfile } from '@/utils/admin-auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/initial-password',
    name: 'InitialPassword',
    component: () => import('@/pages/InitialPassword.vue'),
    meta: { requiresAuth: true, passwordChange: 'initial' },
  },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'Dashboard', component: () => import('@/pages/Dashboard.vue') },
      { path: 'activity', name: 'ActivityList', component: () => import('@/pages/activity/ActivityList.vue') },
      { path: 'activity/:id/checkin-statistics', name: 'ActivityCheckinStatistics', component: () => import('@/pages/activity/CheckinStatistics.vue') },
      { path: 'activity/brands', name: 'ActivitySeriesList', component: () => import('@/pages/operation/ActivitySeriesList.vue') },
      { path: 'activity/banners', name: 'BannerList', component: () => import('@/pages/operation/BannerList.vue') },
      { path: 'activity/categories', name: 'ActivityCategoryList', component: () => import('@/pages/dictionary/ActivityCategoryList.vue') },
      { path: 'orders', name: 'OrderList', component: () => import('@/pages/order/OrderList.vue') },
      { path: 'finance', name: 'FinanceSummary', component: () => import('@/pages/finance/FinanceSummary.vue') },
      { path: 'invoices', name: 'InvoiceList', component: () => import('@/pages/invoice/InvoiceList.vue') },
      { path: 'crm/users', name: 'UserList', component: () => import('@/pages/crm/UserList.vue') },
      { path: 'crm/users/:userId', name: 'UserDetail', component: () => import('@/pages/crm/UserDetail.vue') },
      { path: 'certificate-templates', name: 'CertificateTemplateList', component: () => import('@/pages/certificate/CertificateTemplateList.vue') },
      { path: 'checkin', name: 'MobileCheckin', component: () => import('@/pages/MobileCheckin.vue') },
      { path: 'change-password', name: 'ChangePassword', component: () => import('@/pages/ChangePassword.vue') },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  const token = localStorage.getItem('admin_token')
  if (!to.meta.requiresAuth && to.path !== '/login') return next()
  if (!token) return to.meta.requiresAuth ? next('/login') : next()

  try {
    const response = await axios.get(`${API_BASE_URL}/admin/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
    const profile = response.data
    saveAdminProfile(profile)
    if (profile.mustChangePassword && to.path !== '/initial-password') return next('/initial-password')
    if (!profile.mustChangePassword && to.path === '/initial-password') return next('/')
    if (to.path === '/login') return next('/')
    return next()
  } catch {
    clearAdminSession()
    if (to.meta.requiresAuth || to.path === '/login') return next('/login')
    return next()
  }
})

export default router
