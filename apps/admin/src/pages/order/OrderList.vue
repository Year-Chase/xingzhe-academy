<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { useRouter } from 'vue-router'
import { get, post } from '@/api/client'

interface OrderItem { id: number; registrationId: number; userId: string; userNickname: string; activityId: number; activityTitle: string; amount: number; refundedAmount: number; status: string; payType: string; postpayStatus?: string; orderPrepayAmount?: number; orderPostpayAmount?: number; createdAt: string; paidAt: string; refundedAt: string }
interface PageData { items: OrderItem[]; total: number; page: number; limit: number }

const list = ref<OrderItem[]>([]); const total = ref(0); const page = ref(1); const limit = ref(20); const loading = ref(false)
const refundDialog = ref(false); const refundId = ref(0); const refundAmount = ref(0); const refundReason = ref(''); const refundLoading = ref(false)

const fetchList = async () => {
  loading.value = true
  try {
    const data = await get<PageData>('/admin/orders', { page: page.value, limit: limit.value })
    list.value = (data.items || []).map(normalizeOrder)
    total.value = data.total || 0
  }
  catch (e: any) { MessagePlugin.error(e?.response?.data?.message || '加载失败') }
  finally { loading.value = false }
}

const fmt = (s: string) => s ? new Date(s).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'
const money = (n: number | string | null | undefined) => `¥${Number(n || 0).toFixed(2)}`
const onPageChange = (p: { current: number; pageSize: number }) => { page.value = p.current; limit.value = p.pageSize; fetchList() }

const normalizeOrder = (row: any): OrderItem => ({
  ...row,
  amount: Number(row.amount || 0),
  refundedAmount: Number(row.refundedAmount || 0),
  orderPrepayAmount: Number(row.orderPrepayAmount || 0),
  orderPostpayAmount: Number(row.orderPostpayAmount || 0),
})

const openRefund = (row: OrderItem) => { refundId.value = row.id; refundAmount.value = Number(row.amount || 0) - Number(row.refundedAmount || 0); refundReason.value = ''; refundDialog.value = true }
const doRefund = async () => {
  refundLoading.value = true
  try { await post('/admin/orders/' + refundId.value + '/refund', { amount: refundAmount.value, reason: refundReason.value }); MessagePlugin.success('退款成功'); refundDialog.value = false; fetchList() }
  catch (e: any) { MessagePlugin.error(e?.response?.data?.message || '退款失败') }
  finally { refundLoading.value = false }
}

const statusLabel = (s: string) => ({ PENDING: '交易处理中', PAID: '已支付', FAILED: '支付失败', REFUNDED: '已退款', PARTIAL_REFUND: '部分退款' } as any)[s] || s
const statusColor = (s: string) => ({ PAID: '#2E7D5A', REFUNDED: '#8A9288', PARTIAL_REFUND: '#C98255', PENDING: '#8A9288', FAILED: '#B35B4B' } as any)[s] || '#666'

const canRefund = (row: OrderItem) => {
  const amount = Number(row.amount || 0)
  const refundedAmount = Number(row.refundedAmount || 0)
  const remaining = amount - refundedAmount
  return (row.status === 'PAID' || row.status === 'PARTIAL_REFUND') && remaining > 0
}

const router = useRouter()

const columns = [
  { colKey: 'id', title: 'ID', width: 60 },
  { colKey: 'userId', title: '用户ID', width: 100, cell: (_h: any, { row }: any) => {
    const uid = row.userId || '-'
    return uid.length > 18 ? uid.slice(0, 8) + '...' + uid.slice(-6) : uid
  } },
  { colKey: 'userNickname', title: '用户昵称', width: 90 },
  { colKey: 'activityId', title: '活动ID', width: 65, cell: (_h: any, { row }: any) => row.activityId ?? '-' },
  { colKey: 'activityTitle', title: '活动名称', width: 130, cell: (_h: any, { row }: any) => row.activityTitle || '-' },
  { colKey: 'amount', title: '金额', width: 80, cell: (_h: any, { row }: any) => money(row.amount) },
  { colKey: 'refundedAmount', title: '已退', width: 80, cell: (_h: any, { row }: any) => money(row.refundedAmount) },
  { colKey: 'status', title: '状态', width: 110 },
  { colKey: 'payType', title: '类型', width: 60, cell: (_h: any, { row }: any) => ({ FULL: '全款', PREPAY: '预付' } as any)[row.payType] || row.payType },
  { colKey: 'createdAt', title: '创建时间', width: 130, cell: (_h: any, { row }: any) => fmt(row.createdAt) },
  { colKey: 'paidAt', title: '最近支付时间', width: 140, cell: (_h: any, { row }: any) => fmt(row.paidAt) },
  { colKey: 'actions', title: '操作', width: 80, fixed: 'right' as const },
]

onMounted(fetchList)
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h2 style="font-size: 24px; font-weight: 700; color: #18231E; margin: 0;">订单管理</h2>
    </div>
    <div style="background: #FFFFFF; border-radius: 12px; border: 1px solid #EDE9DF; overflow-x: auto;">
      <t-table :data="list" :columns="columns" row-key="id" hover stripe size="small" :loading="loading"
        :pagination="{ current: page, pageSize: limit, total, showJumper: true }" @page-change="onPageChange">
        <template #userNickname="{ row }">
          <span v-if="row.userId" style="color: #2E7D5A; cursor: pointer; text-decoration: underline;" @click="router.push('/crm/users/' + row.userId)">{{ row.userNickname || row.userId }}</span>
          <span v-else style="color: #8A9288;">-</span>
        </template>
        <template #status="{ row }">
          <span :style="{ color: statusColor(row.status), fontSize: '13px', fontWeight: 500 }">{{ statusLabel(row.status) }}</span>
        </template>
        <template #actions="{ row }">
          <t-button v-if="canRefund(row)" theme="default" variant="text" size="small" style="color: #B35B4B;" @click="openRefund(row)">退款</t-button>
        </template>
      </t-table>
    </div>

    <t-dialog v-model:visible="refundDialog" header="退款" width="440px" :confirm-btn="{ content: '确认退款', loading: refundLoading, theme: 'primary' }" :cancel-btn="{ content: '取消' }" @confirm="doRefund">
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div><label style="color: #8A9288; font-size: 13px;">退款金额</label><t-input-number v-model="refundAmount" :min="0.01" style="width: 100%;" /></div>
        <div><label style="color: #8A9288; font-size: 13px;">退款原因</label><t-textarea v-model="refundReason" placeholder="可选" :autosize="{ minRows: 2, maxRows: 4 }" /></div>
      </div>
    </t-dialog>
  </div>
</template>
