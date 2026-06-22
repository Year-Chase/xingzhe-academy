<script setup lang="ts">
import { ref, computed } from 'vue'

interface Activity {
  id: number
  title: string
  location: string
  startTime: string
  status: string
  registeredCount: number
  capacity: number
}

const activities = ref<Activity[]>([
  { id: 1, title: '🏃 奥森晨跑', location: '奥林匹克森林公园南门', startTime: '2026-06-22 07:00', status: 'PUBLISHED', registeredCount: 1, capacity: 30 },
  { id: 2, title: '🚴 周末骑行', location: '温榆河绿道入口', startTime: '2026-06-23 08:00', status: 'PUBLISHED', registeredCount: 0, capacity: 20 },
  { id: 3, title: '🧘 朝阳公园瑜伽', location: '朝阳公园中心草坪', startTime: '2026-06-24 09:00', status: 'PUBLISHED', registeredCount: 0, capacity: 25 },
  { id: 4, title: '⛰️ 香山徒步', location: '香山邮局', startTime: '2026-06-28 06:00', status: 'PUBLISHED', registeredCount: 0, capacity: 15 },
  { id: 5, title: '🏊 游泳训练', location: '英东游泳馆', startTime: '2026-06-25 14:00', status: 'PUBLISHED', registeredCount: 0, capacity: 12 },
])

const statusLabel = (s: string) => {
  const map: Record<string, string> = { PUBLISHED: '已发布', DRAFT: '草稿', CLOSED: '已下架', ENDED: '已结束' }
  return map[s] || s
}
const statusColor = (s: string) => {
  const map: Record<string, string> = { PUBLISHED: '#2E7D5A', DRAFT: '#8A9288', CLOSED: '#B35B4B', ENDED: '#8A9288' }
  return map[s] || '#666'
}

const columns = [
  { colKey: 'id', title: 'ID', width: 60 },
  { colKey: 'title', title: '活动名称', width: 200 },
  { colKey: 'location', title: '地点', width: 200, ellipsis: true },
  { colKey: 'startTime', title: '开始时间', width: 160 },
  { colKey: 'registeredCount', title: '报名人数', width: 100, cell: (_h: any, { row }: any) => `${row.registeredCount}/${row.capacity}` },
  { colKey: 'status', title: '状态', width: 90 },
  { colKey: 'actions', title: '操作', width: 200, fixed: 'right' as const },
]
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h2 style="font-size: 24px; font-weight: 700; color: #18231E; margin: 0;">活动管理</h2>
      <t-button theme="primary" disabled style="background: #2E7D5A; border-color: #2E7D5A;">
        + 新建活动
      </t-button>
    </div>

    <div style="background: #FFFFFF; border-radius: 12px; border: 1px solid #EDE9DF; overflow: hidden;">
      <t-table
        :data="activities"
        :columns="columns"
        row-key="id"
        hover
        stripe
        size="medium"
        :pagination="{ defaultPageSize: 20 }"
      >
        <template #status="{ row }">
          <span :style="{ color: statusColor(row.status), fontSize: '13px', fontWeight: 500 }">
            {{ statusLabel(row.status) }}
          </span>
        </template>
        <template #actions="{ row }">
          <t-space size="small">
            <t-button theme="default" variant="text" size="small" disabled>查看</t-button>
            <t-button theme="default" variant="text" size="small" disabled>编辑</t-button>
            <t-button theme="default" variant="text" size="small" disabled>发布</t-button>
            <t-button theme="default" variant="text" size="small" disabled>下架</t-button>
          </t-space>
        </template>
      </t-table>
    </div>

    <div style="margin-top: 24px; padding: 20px; background: #EEF5EF; border-radius: 12px; border: 1px solid rgba(46,125,90,0.12);">
      <div style="font-size: 14px; color: #2E7D5A;">
        P2.1 Activity 列表使用 mock 数据。操作按钮（查看/编辑/发布/下架）将在 P2.2-P2.3 对接 Admin API 后启用。
      </div>
    </div>
  </div>
</template>
