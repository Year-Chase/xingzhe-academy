<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface StatCard {
  title: string
  value: number
  unit: string
  trend: string
  icon: string
}

const stats = ref<StatCard[]>([
  { title: '活动总数', value: 5, unit: '个', trend: '+2', icon: '📅' },
  { title: '进行中活动', value: 5, unit: '个', trend: '全部', icon: '🏃' },
  { title: '报名人数', value: 0, unit: '人', trend: '+0', icon: '👥' },
  { title: '今日新增', value: 0, unit: '人', trend: '+0', icon: '✨' },
])

const quickLinks = [
  { label: '新建活动', path: '/activity', icon: '＋' },
  { label: '活动列表', path: '/activity', icon: '活' },
  { label: '品牌管理', path: '/activity/brands', icon: '品' },
  { label: 'Banner管理', path: '/activity/banners', icon: '图' },
  { label: '手机核销', path: '/checkin', icon: '核' },
  { label: '用户运营', path: '/crm/users', icon: '人' },
  { label: '订单管理', path: '/orders', icon: '单' },
  { label: '财务概览', path: '/finance', icon: '财' },
]

onMounted(() => {
  // Dashboard cards intentionally stay lightweight until full reporting APIs are available.
})
</script>

<template>
  <div>
    <h2 style="font-size: 24px; font-weight: 700; color: #18231E; margin: 0 0 24px 0;">控制台</h2>

    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 32px;">
      <div
        v-for="s in stats"
        :key="s.title"
        style="background: #FFFFFF; border-radius: 12px; padding: 24px; border: 1px solid #EDE9DF; box-shadow: 0 2px 8px rgba(24,35,30,0.04);"
      >
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-size: 13px; color: #8A9288; margin-bottom: 8px;">{{ s.title }}</div>
            <div style="display: flex; align-items: baseline; gap: 4px;">
              <span style="font-size: 32px; font-weight: 700; color: #18231E;">{{ s.value }}</span>
              <span style="font-size: 14px; color: #8A9288;">{{ s.unit }}</span>
            </div>
            <div style="font-size: 12px; color: #2E7D5A; margin-top: 8px;">{{ s.trend }}</div>
          </div>
          <span style="font-size: 32px;">{{ s.icon }}</span>
        </div>
      </div>
    </div>

    <div style="background: #FFFFFF; border-radius: 8px; padding: 24px; border: 1px solid #EDE9DF;">
      <div style="font-size: 16px; font-weight: 600; color: #18231E; margin-bottom: 16px;">快速入口</div>
      <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px;">
        <button
          v-for="link in quickLinks"
          :key="link.path"
          type="button"
          @click="$router.push(link.path)"
          style="height: 72px; border-radius: 8px; border: 1px solid #EDE9DF; background: #FBFAF6; display: flex; align-items: center; gap: 12px; padding: 0 16px; cursor: pointer; text-align: left;"
        >
          <span style="width: 34px; height: 34px; border-radius: 8px; background: #EEF5EF; color: #2E7D5A; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 700;">{{ link.icon }}</span>
          <span style="font-size: 14px; font-weight: 600; color: #18231E; white-space: nowrap;">{{ link.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
