<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next'
import { useRouter } from 'vue-router'
import { get, post } from '@/api/client'

interface OrderItem {
  id: number; registrationId: number; userId: string; userNickname: string; userPhone?: string
  activityId: number; activityTitle: string; amount: number; paidAmount: number; refundableAmount: number
  refundedAmount: number; status: string; rawStatus?: string; payType: string; postpayStatus?: string
  orderPrepayAmount?: number; orderPostpayAmount?: number; createdAt: string; paidAt: string; refundedAt: string
  hasIssuedInvoice?: boolean; invoiceStatus?: string | null
}
interface PageData { items: OrderItem[]; total: number; page: number; limit: number }

const list = ref<OrderItem[]>([]); const total = ref(0); const page = ref(1); const limit = ref(20); const loading = ref(false)
const keyword = ref(''); const activityTitle = ref(''); const statusFilter = ref(''); const createdFrom = ref(''); const createdTo = ref('')
const paymentMode = ref(''); const postpayStatus = ref('')
const refundDialog = ref(false); const refundId = ref(0); const refundMax = ref(0); const refundAmount = ref(0); const refundReason = ref(''); const refundReasonError = ref(''); const refundWarning = ref(''); const refundLoading = ref(false)
const postpayActionLoading = ref(0); const postpayWaiveOrderId = ref(0); const postpayWaiveReason = ref(''); const postpayWaiveVisible = ref(false)

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '已支付', value: 'PAID' },
  { label: '部分退款', value: 'PARTIAL_REFUND' },
  { label: '已退款', value: 'REFUNDED' },
  { label: '交易处理中', value: 'PENDING' },
  { label: '支付失败', value: 'FAILED' },
]
const paymentModeOptions = [
  { label: '全部支付方式', value: '' },
  { label: '全款', value: 'FULL' },
  { label: '预付+后付', value: 'PREPAY' },
]
const postpayStatusOptions = [
  { label: '全部后付款', value: '' },
  { label: '无后付款', value: 'NONE' },
  { label: '待后付', value: 'UNPAID' },
  { label: '已后付', value: 'PAID' },
  { label: '已逾期', value: 'OVERDUE' },
  { label: '已免除', value: 'WAIVED' },
]

const fetchList = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, limit: limit.value }
    if (keyword.value) params.keyword = keyword.value
    if (activityTitle.value) params.activityTitle = activityTitle.value
    if (statusFilter.value) params.status = statusFilter.value
    if (createdFrom.value) params.createdFrom = createdFrom.value
    if (createdTo.value) params.createdTo = createdTo.value
    if (paymentMode.value) params.paymentMode = paymentMode.value
    if (postpayStatus.value) params.postpayStatus = postpayStatus.value
    const data = await get<PageData>('/admin/orders', params)
    list.value = (data.items || []).map(normalizeOrder)
    total.value = data.total || 0
  }
  catch (e: any) { MessagePlugin.error(e?.response?.data?.message || '加载失败') }
  finally { loading.value = false }
}

const fmt = (s: string) => s ? new Date(s).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'
const money = (n: number | string | null | undefined) => `¥${Number(n || 0).toFixed(2)}`
const onPageChange = (p: { current: number; pageSize: number }) => { page.value = p.current; limit.value = p.pageSize; fetchList() }
const onSearch = () => { page.value = 1; fetchList() }
const onReset = () => {
  keyword.value = ''; activityTitle.value = ''; statusFilter.value = ''
  createdFrom.value = ''; createdTo.value = ''; paymentMode.value = ''; postpayStatus.value = ''
  onSearch()
}

const normalizeOrder = (row: any): OrderItem => ({
  ...row,
  amount: Number(row.amount || 0),
  paidAmount: Number(row.paidAmount || row.amount || 0),
  refundableAmount: Number(row.refundableAmount || 0),
  refundedAmount: Number(row.refundedAmount || 0),
  orderPrepayAmount: Number(row.orderPrepayAmount || 0),
  orderPostpayAmount: Number(row.orderPostpayAmount || 0),
})

const openRefund = (row: OrderItem) => {
  refundId.value = row.id
  refundMax.value = Number(row.refundableAmount || 0)
  refundAmount.value = 0
  refundReason.value = ''
  refundReasonError.value = ''
  refundWarning.value = row.hasIssuedInvoice ? '该订单已开发票，请线下处理退款' : ''
  if (refundWarning.value) MessagePlugin.warning(refundWarning.value)
  refundDialog.value = true
}
const doRefund = async () => {
  const amount = Number(refundAmount.value || 0)
  if (amount <= 0) { MessagePlugin.warning('退款金额必须大于 0'); return }
  if (amount > refundMax.value) { MessagePlugin.warning('退款金额不能超过可退金额'); return }
  const reason = refundReason.value.trim()
  if (!reason) {
    refundReasonError.value = '请填写退款原因'
    MessagePlugin.warning('请填写退款原因')
    return
  }
  refundLoading.value = true
  try { await post('/admin/orders/' + refundId.value + '/refund', { amount, reason }); MessagePlugin.success('退款成功'); refundDialog.value = false; fetchList() }
  catch (e: any) { MessagePlugin.error(e?.response?.data?.message || '退款失败') }
  finally { refundLoading.value = false }
}

const statusLabel = (s: string) => ({ PENDING: '交易处理中', PAID: '已支付', FAILED: '支付失败', REFUNDED: '已退款', PARTIAL_REFUND: '部分退款' } as any)[s] || s
const statusColor = (s: string) => ({ PAID: '#2E7D5A', REFUNDED: '#8A9288', PARTIAL_REFUND: '#C98255', PENDING: '#8A9288', FAILED: '#B35B4B' } as any)[s] || '#666'

const canRefund = (row: OrderItem) => {
  return (row.status === 'PAID' || row.status === 'PARTIAL_REFUND') && Number(row.refundableAmount || 0) > 0
}
const canPostpayAction = (row: OrderItem) => {
  return row.payType === 'PREPAY'
    && Number(row.orderPostpayAmount || 0) > 0
    && (row.postpayStatus === 'UNPAID' || row.postpayStatus === 'OVERDUE')
    && row.status !== 'REFUNDED'
}

const postpayMarkPaid = async (orderId: number) => {
  const dlg = DialogPlugin.confirm({
    header: '确认已后付',
    body: '确认将该订单标记为后付款已完成？此操作不可撤销。',
    onConfirm: async () => {
      dlg.hide()
      postpayActionLoading.value = orderId
      try {
        await post('/admin/orders/' + orderId + '/mark-postpay-paid')
        MessagePlugin.success('已标记后付款完成')
        fetchList()
      } catch (e: any) {
        MessagePlugin.error(e?.response?.data?.message || '操作失败')
      } finally {
        postpayActionLoading.value = 0
      }
    },
  })
}
const postpaySendReminder = async (orderId: number) => {
  const dlg = DialogPlugin.confirm({
    header: '发送提醒',
    body: '确认向该用户发送后付款提醒？',
    onConfirm: async () => {
      dlg.hide()
      postpayActionLoading.value = orderId
      try {
        const res = await post('/admin/orders/' + orderId + '/postpay-reminder')
        MessagePlugin.success('当前仅记录提醒次数，尚未接入微信通知 · 第' + ((res as any)?.postpayReminderCount || '') + '次')
        fetchList()
      } catch (e: any) {
        MessagePlugin.error(e?.response?.data?.message || '操作失败')
      } finally {
        postpayActionLoading.value = 0
      }
    },
  })
}
const postpayOpenWaive = (orderId: number) => {
  postpayWaiveOrderId.value = orderId
  postpayWaiveReason.value = ''
  postpayWaiveVisible.value = true
}
const postpayConfirmWaive = async () => {
  if (!postpayWaiveReason.value.trim()) { MessagePlugin.warning('请填写免除原因'); return }
  postpayActionLoading.value = postpayWaiveOrderId.value
  try {
    await post('/admin/orders/' + postpayWaiveOrderId.value + '/waive-postpay', { reason: postpayWaiveReason.value.trim() })
    MessagePlugin.success('后付款已免除')
    postpayWaiveVisible.value = false
    fetchList()
  } catch (e: any) {
    MessagePlugin.error(e?.response?.data?.message || '操作失败')
  } finally {
    postpayActionLoading.value = 0
  }
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
  { colKey: 'paidAmount', title: '已付', width: 80, cell: (_h: any, { row }: any) => money(row.paidAmount) },
  { colKey: 'refundedAmount', title: '已退', width: 80, cell: (_h: any, { row }: any) => money(row.refundedAmount) },
  { colKey: 'refundableAmount', title: '可退', width: 80, cell: (_h: any, { row }: any) => money(row.refundableAmount) },
  { colKey: 'status', title: '状态', width: 110 },
  { colKey: 'payType', title: '类型', width: 60, cell: (_h: any, { row }: any) => ({ FULL: '全款', PREPAY: '预付' } as any)[row.payType] || row.payType },
  { colKey: 'postpayStatus', title: '后付款', width: 80, cell: (_h: any, { row }: any) => ({ NONE: '无', UNPAID: '待后付', PAID: '已后付', OVERDUE: '已逾期', WAIVED: '已免除' } as any)[row.postpayStatus] || row.postpayStatus || '-' },
  { colKey: 'createdAt', title: '创建时间', width: 130, cell: (_h: any, { row }: any) => fmt(row.createdAt) },
  { colKey: 'paidAt', title: '最近支付时间', width: 140, cell: (_h: any, { row }: any) => fmt(row.paidAt) },
  { colKey: 'actions', title: '操作', width: 170, fixed: 'right' as const },
]

onMounted(fetchList)
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h2 style="font-size: 24px; font-weight: 700; color: #18231E; margin: 0;">订单管理</h2>
    </div>
    <div style="background: #FFFFFF; border-radius: 12px; border: 1px solid #EDE9DF; padding: 16px; margin-bottom: 16px;">
      <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
        <t-input v-model="keyword" placeholder="用户昵称 / 手机号" clearable style="width: 180px;" @enter="onSearch" />
        <t-input v-model="activityTitle" placeholder="活动名称" clearable style="width: 180px;" @enter="onSearch" />
        <t-select v-model="statusFilter" :options="statusOptions" style="width: 130px;" @change="onSearch" />
        <t-select v-model="paymentMode" :options="paymentModeOptions" style="width: 130px;" @change="onSearch" />
        <t-select v-model="postpayStatus" :options="postpayStatusOptions" style="width: 130px;" @change="onSearch" />
        <span style="color: #8A9288; font-size: 12px;">创建</span>
        <t-date-picker v-model="createdFrom" placeholder="开始" clearable style="width: 140px;" @change="onSearch" />
        <t-date-picker v-model="createdTo" placeholder="结束" clearable style="width: 140px;" @change="onSearch" />
        <t-button theme="primary" @click="onSearch">查询</t-button>
        <t-button theme="default" variant="outline" @click="onReset">重置</t-button>
      </div>
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
          <t-space size="small" break-line>
            <t-button v-if="canPostpayAction(row)" theme="default" variant="text" size="small" style="color: #2E7D5A;" :loading="postpayActionLoading === row.id" @click="postpayMarkPaid(row.id)">标记已付</t-button>
            <t-button v-if="canPostpayAction(row)" theme="default" variant="text" size="small" style="color: #8A6D3B;" :loading="postpayActionLoading === row.id" @click="postpaySendReminder(row.id)">记录提醒</t-button>
            <t-button v-if="canPostpayAction(row)" theme="default" variant="text" size="small" style="color: #B35B4B;" @click="postpayOpenWaive(row.id)">免除</t-button>
            <t-button v-if="canRefund(row)" theme="default" variant="text" size="small" style="color: #B35B4B;" @click="openRefund(row)">退款</t-button>
          </t-space>
        </template>
      </t-table>
    </div>

    <t-dialog v-model:visible="refundDialog" header="退款" width="440px" :confirm-btn="{ content: '确认退款', loading: refundLoading, theme: 'primary' }" :cancel-btn="{ content: '取消' }" @confirm="doRefund">
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div v-if="refundWarning" style="padding: 10px 12px; border-radius: 8px; background: #FFF7E8; color: #A05A00; font-size: 13px;">{{ refundWarning }}</div>
        <div style="color: #3E463F; font-size: 13px;">当前最多可退 <strong>{{ money(refundMax) }}</strong></div>
        <div><label style="color: #8A9288; font-size: 13px;">退款金额</label><t-input-number v-model="refundAmount" :min="0" :max="refundMax" style="width: 100%;" /></div>
        <div>
          <label style="color: #8A9288; font-size: 13px;">退款原因</label>
          <t-textarea v-model="refundReason" placeholder="请填写退款原因" :autosize="{ minRows: 2, maxRows: 4 }" @input="refundReasonError = ''" />
          <div v-if="refundReasonError" style="color: #B35B4B; font-size: 12px; margin-top: 4px;">{{ refundReasonError }}</div>
        </div>
      </div>
    </t-dialog>

    <t-dialog v-model:visible="postpayWaiveVisible" header="免除后付款" :on-confirm="postpayConfirmWaive" :confirm-btn="{ content: '确认免除', loading: postpayActionLoading === postpayWaiveOrderId }">
      <div style="padding: 8px 0;">
        <t-textarea v-model="postpayWaiveReason" placeholder="请填写免除原因（必填）" :autosize="{ minRows: 2, maxRows: 4 }" />
      </div>
    </t-dialog>
  </div>
</template>
