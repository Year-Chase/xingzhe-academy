import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'Dashboard', component: () => import('@/pages/Dashboard.vue') },
      { path: 'activity', name: 'ActivityList', component: () => import('@/pages/activity/ActivityList.vue') },
      { path: 'dictionary/activity-categories', name: 'ActivityCategoryList', component: () => import('@/pages/dictionary/ActivityCategoryList.vue') },
      { path: 'orders', name: 'OrderList', component: () => import('@/pages/order/OrderList.vue') },
      { path: 'finance', name: 'FinanceSummary', component: () => import('@/pages/finance/FinanceSummary.vue') },
      { path: 'invoices', name: 'InvoiceList', component: () => import('@/pages/invoice/InvoiceList.vue') },
      { path: 'crm/users', name: 'UserList', component: () => import('@/pages/crm/UserList.vue') },
      { path: 'crm/users/:userId', name: 'UserDetail', component: () => import('@/pages/crm/UserDetail.vue') },
      { path: 'certificate-templates', name: 'CertificateTemplateList', component: () => import('@/pages/certificate/CertificateTemplateList.vue') },
      { path: 'checkin', name: 'MobileCheckin', component: () => import('@/pages/MobileCheckin.vue') },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.meta.requiresAuth && !token) { next('/login') }
  else if (to.path === '/login' && token) { next('/') }
  else { next() }
})

export default router
