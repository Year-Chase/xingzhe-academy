<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const collapsed = ref(false)

const menuItems = [
  { path: '/', name: 'Dashboard', label: '控制台' },
  { path: '/activity', name: 'ActivityList', label: '活动管理' },
  { path: '/orders', name: 'OrderList', label: '订单管理' },
  { path: '/finance', name: 'FinanceSummary', label: '财务概览' },
  { path: '/invoices', name: 'InvoiceList', label: '发票管理' },
  { path: '/crm/users', name: 'UserList', label: '用户运营' },
  { path: '/certificate-templates', name: 'CertificateTemplateList', label: '证书模板' },
  { path: '/checkin', name: 'MobileCheckin', label: '手机核销' },
]

function logout() {
  localStorage.removeItem('admin_token')
  router.push('/login')
}

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <t-layout style="min-height: 100vh">
    <t-aside :width="collapsed ? '64px' : '220px'" style="background: #18231E; transition: width 0.2s;">
      <div style="padding: 20px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08);">
        <span v-if="!collapsed" style="color: #FBFAF6; font-size: 18px; font-weight: 700; white-space: nowrap;">行者学社</span>
        <span v-else style="color: #FBFAF6; font-size: 18px; font-weight: 700;">行</span>
      </div>
      <t-menu
        theme="dark"
        :value="route.path"
        :collapsed="collapsed"
        style="background: transparent; border: none; margin-top: 8px;"
        @change="(path: string) => router.push(path)"
      >
        <t-menu-item
          v-for="item in menuItems"
          :key="item.path"
          :value="item.path"
          @click="router.push(item.path)"
        >
          <template #icon>
            <span v-if="item.path === '/'">📊</span>
            <span v-else-if="item.path === '/activity'">📅</span>
            <span v-else-if="item.path === '/orders'">📋</span>
            <span v-else-if="item.path === '/finance'">💰</span>
            <span v-else-if="item.path === '/invoices'">🧾</span>
            <span v-else-if="item.path === '/crm/users'">👥</span>
            <span v-else-if="item.path === '/certificate-templates'">🏅</span>
            <span v-else-if="item.path === '/checkin'">✅</span>
          </template>
          {{ item.label }}
        </t-menu-item>
      </t-menu>

      <div style="position: absolute; bottom: 20px; left: 16px; right: 16px;">
        <t-button theme="default" variant="text" block @click="logout" style="color: rgba(255,255,255,0.6);">
          {{ collapsed ? '出' : '退出登录' }}
        </t-button>
      </div>
    </t-aside>

    <t-layout>
      <t-header style="background: #FFFFFF; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #EDE9DF; height: 56px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <t-button theme="default" variant="text" @click="collapsed = !collapsed" style="font-size: 20px;">
            {{ collapsed ? '☰' : '☰' }}
          </t-button>
          <span style="color: #18231E; font-size: 16px; font-weight: 600;">
            {{ route.meta?.title || '行者学社 Admin' }}
          </span>
        </div>
        <span style="color: #8A9288; font-size: 14px;">Admin v1.0</span>
      </t-header>

      <t-content style="background: #F7F6F2; padding: 24px; overflow-x: auto; min-width: 0;">
        <router-view />
      </t-content>
    </t-layout>
  </t-layout>
</template>
