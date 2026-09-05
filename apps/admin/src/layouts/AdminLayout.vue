<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const collapsed = ref(false)

const activityMenuItems = [
  { path: '/activity', label: '活动列表' },
  { path: '/activity/brands', label: '品牌管理' },
  { path: '/activity/categories', label: '活动分类' },
  { path: '/activity/banners', label: 'Banner管理' },
  { path: '/checkin', label: '手机核销' },
  { path: '/certificate-templates', label: '证书模板' },
]

const financeMenuItems = [
  { path: '/finance', label: '财务概览' },
  { path: '/invoices', label: '发票管理' },
]

function handleMenuChange(path: string) {
  if (path.startsWith('/')) router.push(path)
}

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
        @change="handleMenuChange"
      >
        <t-menu-item value="/" @click="router.push('/')">
          <template #icon><span>📊</span></template>
          控制台
        </t-menu-item>
        <t-submenu value="activity-management">
          <template #icon><span>📅</span></template>
          <template #title>活动管理</template>
          <t-menu-item v-for="item in activityMenuItems" :key="item.path" :value="item.path">{{ item.label }}</t-menu-item>
        </t-submenu>
        <t-menu-item value="/crm/users" @click="router.push('/crm/users')">
          <template #icon><span>👥</span></template>
          用户运营
        </t-menu-item>
        <t-menu-item value="/orders" @click="router.push('/orders')">
          <template #icon><span>📋</span></template>
          订单管理
        </t-menu-item>
        <t-submenu value="finance-management">
          <template #icon><span>💰</span></template>
          <template #title>财务管理</template>
          <t-menu-item v-for="item in financeMenuItems" :key="item.path" :value="item.path">{{ item.label }}</t-menu-item>
        </t-submenu>
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
