<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { get } from '@/api/client'

type CheckinStats = {
  activity: {
    id: number
    title: string
    startTime: string | null
    endTime: string | null
    status: string
    category: { id: number | string; name: string } | null
  }
  totalRegistrations: number
  validRegistrations: number
  checkedInCount: number
  uncheckedCount: number
  checkinRate: number
  staffCheckinCount: number
  adminCheckinCount: number
  unpaidPostpayCheckedInCount: number
  refundedCheckedInCount: number
}

type CheckinRecord = {
  id: number
  nickname: string
  phoneMasked: string | null
  registeredAt: string
  registrationStatus: string
  checkinStatus: string
  checkedInAt: string | null
  checkinSourceLabel: string
  checkedInBy: { id: string; nickname: string } | null
  paymentStatus: string
  refundStatus: string
}

const route = useRoute()
const router = useRouter()
const activityId = computed(() => Number(route.params.id || 0))

const stats = ref<CheckinStats | null>(null)
const records = ref<CheckinRecord[]>([])
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const status = ref('')
const keyword = ref('')
const sort = ref('CHECKIN_DESC')
const loadingStats = ref(false)
const loadingRecords = ref(false)

const fmtDateTime = (value: string | null) => value ? new Date(value).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'
const percent = (value: number) => `${((Number(value || 0)) * 100).toFixed(1)}%`
const statusLabel = (value: string) => ({
  REGISTERED: '已报名',
  PAID: '已支付',
  CHECKED_IN: '已签到',
  EXPIRED: '已过期',
  PENDING: '待支付',
  REFUNDED: '已退款',
  PARTIAL_REFUND: '部分退款',
  FAILED: '失败',
  DRAFT: '未发布',
  PUBLISHED: '已发布',
  CLOSED: '已下架',
} as Record<string, string>)[value] || value || '-'
const statusColor = (value: string) => ({
  CHECKED_IN: '#2E7D5A',
  PAID: '#2E7D5A',
  PUBLISHED: '#2E7D5A',
  PARTIAL_REFUND: '#C98255',
  REFUNDED: '#8A9288',
  EXPIRED: '#8A9288',
  CLOSED: '#B35B4B',
  FAILED: '#B35B4B',
} as Record<string, string>)[value] || '#6F766F'

const metricCards = computed(() => {
  const s = stats.value
  if (!s) return []
  return [
    { label: '报名总人数', value: s.totalRegistrations },
    { label: '有效报名人数', value: s.validRegistrations },
    { label: '已签到人数', value: s.checkedInCount },
    { label: '未签到人数', value: s.uncheckedCount },
    { label: '签到率', value: percent(s.checkinRate) },
    { label: '工作人员核销人数', value: s.staffCheckinCount },
    { label: 'Admin核销人数', value: s.adminCheckinCount },
    { label: '后付款未完成但已签到', value: s.unpaidPostpayCheckedInCount },
    { label: '退款后签到人数', value: s.refundedCheckedInCount },
  ]
})

const fetchStats = async () => {
  if (!activityId.value) return
  loadingStats.value = true
  try {
    stats.value = await get<CheckinStats>(`/admin/activity/${activityId.value}/checkin-statistics`)
  } catch (e: any) {
    MessagePlugin.error(e?.response?.data?.message || '统计加载失败')
  } finally {
    loadingStats.value = false
  }
}

const fetchRecords = async () => {
  if (!activityId.value) return
  loadingRecords.value = true
  try {
    const data = await get<{ items: CheckinRecord[]; total: number; page: number; limit: number }>(`/admin/activity/${activityId.value}/checkin-records`, {
      page: page.value,
      limit: limit.value,
      status: status.value || undefined,
      keyword: keyword.value || undefined,
      sort: sort.value,
    })
    records.value = data.items
    total.value = data.total
  } catch (e: any) {
    MessagePlugin.error(e?.response?.data?.message || '明细加载失败')
  } finally {
    loadingRecords.value = false
  }
}

const reload = () => {
  fetchStats()
  fetchRecords()
}
const onSearch = () => {
  page.value = 1
  fetchRecords()
}
const onPageChange = (p: { current: number; pageSize: number }) => {
  page.value = p.current
  limit.value = p.pageSize
  fetchRecords()
}

const columns = [
  { colKey: 'nickname', title: '用户昵称', width: 110 },
  { colKey: 'phoneMasked', title: '手机号', width: 120 },
  { colKey: 'registeredAt', title: '报名时间', width: 150 },
  { colKey: 'registrationStatus', title: '报名状态', width: 90 },
  { colKey: 'checkinStatus', title: '签到状态', width: 90 },
  { colKey: 'checkedInAt', title: '签到时间', width: 150 },
  { colKey: 'checkinSourceLabel', title: '签到来源', width: 110 },
  { colKey: 'checkedInBy', title: '核销工作人员', width: 120 },
  { colKey: 'paymentStatus', title: '支付状态', width: 90 },
  { colKey: 'refundStatus', title: '退款状态', width: 90 },
]

onMounted(reload)
</script>

<template>
  <div>
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
      <div>
        <h2 style="font-size: 24px; font-weight: 700; color: #18231E; margin: 0;">签到统计</h2>
        <div v-if="stats" style="margin-top: 6px; color: #7A8178; font-size: 13px;">{{ stats.activity.title }}</div>
      </div>
      <div style="display: flex; gap: 8px;">
        <t-button theme="default" variant="outline" @click="router.push('/activity')">返回活动管理</t-button>
        <t-button style="background: #2E7D5A; border-color: #2E7D5A; color: #fff;" @click="reload">刷新</t-button>
      </div>
    </div>

    <div style="background: #FFFFFF; border: 1px solid #EDE9DF; border-radius: 12px; padding: 18px; margin-bottom: 16px;" :aria-busy="loadingStats">
      <div v-if="stats" style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px;">
        <div>
          <div style="color: #8A9288; font-size: 12px;">活动名称</div>
          <div style="color: #18231E; font-weight: 700; margin-top: 4px;">{{ stats.activity.title }}</div>
        </div>
        <div>
          <div style="color: #8A9288; font-size: 12px;">活动时间</div>
          <div style="color: #333A34; margin-top: 4px;">{{ fmtDateTime(stats.activity.startTime) }} ~ {{ fmtDateTime(stats.activity.endTime) }}</div>
        </div>
        <div>
          <div style="color: #8A9288; font-size: 12px;">活动状态</div>
          <div :style="{ color: statusColor(stats.activity.status), fontWeight: 700, marginTop: '4px' }">{{ statusLabel(stats.activity.status) }}</div>
        </div>
        <div>
          <div style="color: #8A9288; font-size: 12px;">活动分类</div>
          <div style="color: #333A34; margin-top: 4px;">{{ stats.activity.category?.name || '-' }}</div>
        </div>
      </div>
      <div v-else style="color: #8A9288;">加载中...</div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; margin-bottom: 18px;">
      <div v-for="item in metricCards" :key="item.label" style="background: #FFFFFF; border: 1px solid #EDE9DF; border-radius: 10px; padding: 16px;">
        <div style="color: #8A9288; font-size: 12px;">{{ item.label }}</div>
        <div style="color: #18231E; font-size: 24px; line-height: 1.4; font-weight: 700; margin-top: 6px;">{{ item.value }}</div>
      </div>
    </div>

    <div style="background: #FFFFFF; border: 1px solid #EDE9DF; border-radius: 12px; padding: 16px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
        <t-select v-model="status" :options="[{ label: '全部签到状态', value: '' }, { label: '已签到', value: 'CHECKED_IN' }, { label: '未签到', value: 'NOT_CHECKED_IN' }]" style="width: 150px;" @change="onSearch" />
        <t-input v-model="keyword" placeholder="搜索昵称/手机号" clearable style="width: 220px;" @enter="onSearch" />
        <t-select v-model="sort" :options="[{ label: '签到时间倒序', value: 'CHECKIN_DESC' }, { label: '报名时间倒序', value: 'REGISTRATION_DESC' }]" style="width: 150px;" @change="onSearch" />
        <t-button @click="onSearch" style="background: #2E7D5A; border-color: #2E7D5A; color: #fff;">查询</t-button>
      </div>

      <t-table :data="records" :columns="columns" row-key="id" hover stripe size="small" :loading="loadingRecords"
        :pagination="{ current: page, pageSize: limit, total, showJumper: true }" @page-change="onPageChange" table-layout="auto">
        <template #phoneMasked="{ row }">{{ row.phoneMasked || '-' }}</template>
        <template #registeredAt="{ row }">{{ fmtDateTime(row.registeredAt) }}</template>
        <template #registrationStatus="{ row }"><span :style="{ color: statusColor(row.registrationStatus), fontWeight: 500 }">{{ statusLabel(row.registrationStatus) }}</span></template>
        <template #checkinStatus="{ row }"><span :style="{ color: row.checkinStatus === 'CHECKED_IN' ? '#2E7D5A' : '#8A9288', fontWeight: 500 }">{{ row.checkinStatus === 'CHECKED_IN' ? '已签到' : '未签到' }}</span></template>
        <template #checkedInAt="{ row }">{{ row.checkedInAt ? fmtDateTime(row.checkedInAt) : '-' }}</template>
        <template #checkedInBy="{ row }">{{ row.checkedInBy?.nickname || '-' }}</template>
        <template #paymentStatus="{ row }"><span :style="{ color: statusColor(row.paymentStatus), fontWeight: 500 }">{{ statusLabel(row.paymentStatus) }}</span></template>
        <template #refundStatus="{ row }"><span :style="{ color: statusColor(row.refundStatus), fontWeight: 500 }">{{ statusLabel(row.refundStatus) }}</span></template>
        <template #empty><div style="padding: 36px 0; color: #8A9288;">暂无签到明细</div></template>
      </t-table>
    </div>
  </div>
</template>
