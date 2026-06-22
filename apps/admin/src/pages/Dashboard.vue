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

onMounted(() => {
  // P2.1 uses mock data only
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

    <div style="background: #FFFFFF; border-radius: 12px; padding: 24px; border: 1px solid #EDE9DF;">
      <div style="font-size: 16px; font-weight: 600; color: #18231E; margin-bottom: 16px;">快速入口</div>
      <div style="display: flex; gap: 16px;">
        <t-button theme="default" variant="outline" @click="$router.push('/activity')">
          📅 活动管理
        </t-button>
        <t-button theme="default" variant="outline" disabled>
          📋 订单只读（开发中）
        </t-button>
        <t-button theme="default" variant="outline" disabled>
          👥 用户只读（开发中）
        </t-button>
      </div>
    </div>

    <div style="margin-top: 24px; padding: 20px; background: #EEF5EF; border-radius: 12px; border: 1px solid rgba(46,125,90,0.12);">
      <div style="font-size: 14px; color: #2E7D5A;">
        P2.1 Admin 基础工程已就绪。Activity 列表页面使用 mock 数据展示，后续 P2.2-P2.5 将对接真实 Admin API。
      </div>
    </div>
  </div>
</template>
