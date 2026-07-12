<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next'
import { useRouter } from 'vue-router'
import { get, post } from '@/api/client'
import { assetUrl } from '@/config/api'

interface OrderItem {
  id: number; registrationId: number; userId: string; userNickname: string
  activityId: number; activityTitle: string; amount: number; paidAmount: number; refundableAmount: number
  refundedAmount: number; status: string; rawStatus?: string; payType: string; postpayStatus?: string
  orderPrepayAmount?: number; orderPostpayAmount?: number; createdAt: string; paidAt: string; refundedAt: string
  hasIssuedInvoice?: boolean; invoiceStatus?: string | null
}
interface PageData { items: OrderItem[]; total: number; page: number; limit: number }
interface OrderDetail {
  id: number; status: string; createdAt: string | null; paidAt: string | null; payType: string
  activity: null | { id: number; title: string; startTime: string | null; endTime: string | null; locationName: string | null; locationAddress: string | null }
  user: { id: string | null; nickname: string | null; avatarUrl: string | null; phoneMasked: string | null; identityType: string | null; userTypeAtOrder: string | null }
  money: { priceSource: string | null; fullAmount: number; orderAmount: number; prepayAmount: number; postpayAmount: number; paidAmount: number; refundedAmount: number; refundableAmount: number }
  postpay: { dueAt: string | null; status: string; paidAt: string | null; reminderCount: number; lastReminderAt: string | null; waivedAt: string | null; waiveReason: string | null }
  refunds: { id: number; amount: number; reason: string | null; status: string; createdAt: string | null }[]
  invoices: { id: number; title: string; amount: number; status: string; createdAt: string | null; issuedAt: string | null }[]
  timeline: { type: string; time: string; label: string }[]
}

const list = ref<OrderItem[]>([]); const total = ref(0); const page = ref(1); const limit = ref(20); const loading = ref(false)
const keyword = ref(''); const activityTitle = ref(''); const statusFilter = ref(''); const createdFrom = ref(''); const createdTo = ref('')
const paymentMode = ref(''); const postpayStatus = ref('')
const refundDialog = ref(false); const refundId = ref(0); const refundMax = ref(0); const refundAmount = ref(0); const refundReason = ref(''); const refundReasonError = ref(''); const refundWarning = ref(''); const refundLoading = ref(false)
const detailVisible = ref(false); const detailLoading = ref(false); const detailData = ref<OrderDetail | null>(null); const detailError = ref(''); const detailOrderId = ref(0)
const postpayActionLoading = ref(false); const postpayWaiveReason = ref(''); const postpayWaiveVisible = ref(false)

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

const router = useRouter()

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

const dash = (v: any) => (v === null || v === undefined || v === '' ? '—' : v)
const fmt = (s: string | null | undefined) => {
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return '—'
  const bj = new Date(d.getTime() + 8 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${bj.getUTCFullYear()}-${pad(bj.getUTCMonth() + 1)}-${pad(bj.getUTCDate())} ${pad(bj.getUTCHours())}:${pad(bj.getUTCMinutes())}:${pad(bj.getUTCSeconds())}`
}
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
  try {
    await post('/admin/orders/' + refundId.value + '/refund', { amount, reason })
    MessagePlugin.success('退款成功')
    refundDialog.value = false
    await fetchList()
    if (detailVisible.value && detailOrderId.value === refundId.value) await refreshDetail()
  }
  catch (e: any) { MessagePlugin.error(e?.response?.data?.message || '退款失败') }
  finally { refundLoading.value = false }
}

const statusLabel = (s: string) => ({ PENDING: '交易处理中', PAID: '已支付', FAILED: '支付失败', REFUNDED: '已退款', PARTIAL_REFUND: '部分退款' } as any)[s] || s
const statusColor = (s: string) => ({ PAID: '#2E7D5A', REFUNDED: '#8A9288', PARTIAL_REFUND: '#C98255', PENDING: '#8A9288', FAILED: '#B35B4B' } as any)[s] || '#666'
const payTypeLabel = (s: string) => ({ FULL: '全款', PREPAY: '预付 + 后付' } as any)[s] || s || '—'
const postpayStatusLabel = (s: string) => ({ NONE: '无', UNPAID: '待后付', PAID: '已后付', OVERDUE: '已逾期', WAIVED: '已免除' } as any)[s] || s || '—'
const priceSourceLabel = (s: string | null) => ({ pricingRules: '价格矩阵', legacy: '旧价格字段' } as any)[s || ''] || dash(s)
const refundStatusLabel = (s: string) => ({ SUCCESS: '成功', FAILED: '失败' } as any)[s] || s
const invoiceStatusLabel = (s: string) => ({ REQUESTED: '待开票', PENDING: '待开票', ISSUED: '已开票', CANCELED: '已取消', REFUNDED: '已退款' } as any)[s] || s

const canRefund = (row: OrderItem) => {
  return (row.status === 'PAID' || row.status === 'PARTIAL_REFUND') && Number(row.refundableAmount || 0) > 0
}
const canPostpayAction = (detail: OrderDetail | null) => {
  return !!detail
    && detail.payType === 'PREPAY'
    && Number(detail.money?.postpayAmount || 0) > 0
    && (detail.postpay?.status === 'UNPAID' || detail.postpay?.status === 'OVERDUE')
    && detail.status !== 'REFUNDED'
}
const showPostpaySection = (detail: OrderDetail | null) => {
  return !!detail && (detail.payType === 'PREPAY' || Number(detail.money?.postpayAmount || 0) > 0 || detail.postpay?.status !== 'NONE')
}

const loadOrderDetail = async (id: number) => {
  detailLoading.value = true
  detailError.value = ''
  try { detailData.value = await get<OrderDetail>('/admin/orders/' + id) }
  catch (e: any) {
    detailData.value = null
    detailError.value = e?.response?.status === 404 ? '订单不存在' : (e?.response?.data?.message || '订单详情加载失败')
  }
  finally { detailLoading.value = false }
}
const openDetail = async (row: OrderItem) => {
  detailOrderId.value = row.id
  detailVisible.value = true
  detailData.value = null
  await loadOrderDetail(row.id)
}
const closeDetail = () => {
  detailVisible.value = false
  detailData.value = null
  detailError.value = ''
  detailOrderId.value = 0
}
const refreshDetail = async () => {
  if (detailOrderId.value) await loadOrderDetail(detailOrderId.value)
}

const postpayMarkPaid = async () => {
  if (!detailData.value) return
  const orderId = detailData.value.id
  const dlg = DialogPlugin.confirm({
    header: '确认登记后付款完成',
    body: '该操作仅登记后付款已经完成，不会发起微信支付，也不会生成微信支付流水。确认继续？',
    onConfirm: async () => {
      dlg.hide()
      postpayActionLoading.value = true
      try {
        await post('/admin/orders/' + orderId + '/mark-postpay-paid')
        MessagePlugin.success('已登记后付款完成')
        await refreshDetail()
        await fetchList()
      } catch (e: any) {
        MessagePlugin.error(e?.response?.data?.message || '操作失败')
      } finally {
        postpayActionLoading.value = false
      }
    },
  })
}
const postpayOpenWaive = () => {
  postpayWaiveReason.value = ''
  postpayWaiveVisible.value = true
}
const postpayConfirmWaive = async () => {
  if (!detailData.value) return
  const reason = postpayWaiveReason.value.trim()
  if (!reason) { MessagePlugin.warning('请填写免除原因'); return }
  postpayActionLoading.value = true
  try {
    await post('/admin/orders/' + detailData.value.id + '/waive-postpay', { reason })
    MessagePlugin.success('后付款已免除')
    postpayWaiveVisible.value = false
    await refreshDetail()
    await fetchList()
  } catch (e: any) {
    MessagePlugin.error(e?.response?.data?.message || '操作失败')
  } finally {
    postpayActionLoading.value = false
  }
}

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
  { colKey: 'payType', title: '类型', width: 80, cell: (_h: any, { row }: any) => payTypeLabel(row.payType) },
  { colKey: 'postpayStatus', title: '后付款', width: 80, cell: (_h: any, { row }: any) => postpayStatusLabel(row.postpayStatus) },
  { colKey: 'createdAt', title: '创建时间', width: 150, cell: (_h: any, { row }: any) => fmt(row.createdAt) },
  { colKey: 'paidAt', title: '最近支付时间', width: 150, cell: (_h: any, { row }: any) => fmt(row.paidAt) },
  { colKey: 'actions', title: '操作', width: 120, fixed: 'right' as const },
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
          <t-space size="small">
            <t-button theme="default" variant="text" size="small" style="color: #2E7D5A;" @click="openDetail(row)">详情</t-button>
            <t-button v-if="canRefund(row)" theme="default" variant="text" size="small" style="color: #B35B4B;" @click="openRefund(row)">退款</t-button>
          </t-space>
        </template>
      </t-table>
    </div>

    <t-drawer v-model:visible="detailVisible" header="订单详情" size="800px" :footer="false" @close="closeDetail">
      <t-loading :loading="detailLoading">
        <div v-if="detailError" style="padding: 32px; color: #B35B4B; text-align: center;">{{ detailError }}</div>
        <div v-else-if="detailData" style="display: flex; flex-direction: column; gap: 16px; padding-bottom: 20px;">
          <section class="detail-section">
            <h3>订单基础</h3>
            <div class="detail-grid">
              <span>订单编号</span><strong>#{{ detailData.id }}</strong>
              <span>订单状态</span><strong :style="{ color: statusColor(detailData.status) }">{{ statusLabel(detailData.status) }}</strong>
              <span>创建时间</span><strong>{{ fmt(detailData.createdAt) }}</strong>
              <span>支付时间</span><strong>{{ fmt(detailData.paidAt) }}</strong>
              <span>支付类型</span><strong>{{ payTypeLabel(detailData.payType) }}</strong>
              <span>活动名称</span><strong>{{ detailData.activity?.title || '历史活动数据缺失' }}</strong>
              <span>活动开始</span><strong>{{ fmt(detailData.activity?.startTime) }}</strong>
              <span>活动结束</span><strong>{{ fmt(detailData.activity?.endTime) }}</strong>
              <span>活动地点</span><strong>{{ detailData.activity ? dash(detailData.activity.locationName || detailData.activity.locationAddress) : '历史活动数据缺失' }}</strong>
            </div>
          </section>

          <section class="detail-section">
            <h3>下单用户</h3>
            <div style="display: flex; gap: 14px; align-items: flex-start;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: #EEF5EF; overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <img v-if="detailData.user.avatarUrl" :src="assetUrl(detailData.user.avatarUrl)" style="width:100%;height:100%;object-fit:cover;" />
                <span v-else style="font-size: 18px; color: #A6AAA2;">-</span>
              </div>
              <div class="detail-grid" style="flex: 1;">
                <span>昵称</span><strong>{{ detailData.user.nickname || '历史用户数据缺失' }}</strong>
                <span>报名手机号</span><strong>{{ detailData.user.phoneMasked || '—' }}</strong>
                <span>当前身份</span><strong>{{ dash(detailData.user.identityType) }}</strong>
                <span>下单时身份</span><strong>{{ dash(detailData.user.userTypeAtOrder) }}</strong>
              </div>
            </div>
          </section>

          <section class="detail-section">
            <h3>金额信息</h3>
            <div class="money-grid">
              <div><span>原价</span><strong>{{ money(detailData.money.fullAmount) }}</strong></div>
              <div><span>价格来源</span><strong>{{ priceSourceLabel(detailData.money.priceSource) }}</strong></div>
              <div><span>订单金额</span><strong>{{ money(detailData.money.orderAmount) }}</strong></div>
              <div><span>预付金额</span><strong>{{ money(detailData.money.prepayAmount) }}</strong></div>
              <div><span>后付金额</span><strong>{{ money(detailData.money.postpayAmount) }}</strong></div>
              <div><span>实付金额</span><strong>{{ money(detailData.money.paidAmount) }}</strong></div>
              <div><span>已退款</span><strong>{{ money(detailData.money.refundedAmount) }}</strong></div>
              <div><span>可退款</span><strong>{{ money(detailData.money.refundableAmount) }}</strong></div>
            </div>
          </section>

          <section v-if="showPostpaySection(detailData)" class="detail-section">
            <h3>后付款信息</h3>
            <div class="detail-grid">
              <span>后付款金额</span><strong>{{ money(detailData.money.postpayAmount) }}</strong>
              <span>后付款截止时间</span><strong>{{ fmt(detailData.postpay.dueAt) }}</strong>
              <span>后付款状态</span><strong>{{ postpayStatusLabel(detailData.postpay.status) }}</strong>
              <span>后付款完成时间</span><strong>{{ fmt(detailData.postpay.paidAt) }}</strong>
              <span>历史提醒次数</span><strong>{{ Number(detailData.postpay.reminderCount || 0) }}</strong>
              <span>最后提醒记录时间</span><strong>{{ fmt(detailData.postpay.lastReminderAt) }}</strong>
              <span>免除时间</span><strong>{{ fmt(detailData.postpay.waivedAt) }}</strong>
              <span>免除原因</span><strong>{{ dash(detailData.postpay.waiveReason) }}</strong>
            </div>
          </section>

          <section class="detail-section">
            <h3>退款记录</h3>
            <div v-if="detailData.refunds.length" class="record-list">
              <div v-for="refund in detailData.refunds" :key="refund.id" class="record-item">
                <div><strong>{{ money(refund.amount) }}</strong><span>{{ refundStatusLabel(refund.status) }}</span></div>
                <div>{{ fmt(refund.createdAt) }}</div>
                <p>{{ refund.reason || '—' }}</p>
              </div>
            </div>
            <div v-else class="empty">暂无退款记录</div>
          </section>

          <section class="detail-section">
            <h3>发票记录</h3>
            <div v-if="detailData.invoices.length" class="record-list">
              <div v-for="invoice in detailData.invoices" :key="invoice.id" class="record-item">
                <div><strong>{{ invoice.title }}</strong><span>{{ invoiceStatusLabel(invoice.status) }}</span></div>
                <div>申请：{{ fmt(invoice.createdAt) }} · 开票：{{ fmt(invoice.issuedAt) }}</div>
                <p>申请金额 {{ money(invoice.amount) }}</p>
              </div>
            </div>
            <div v-else class="empty">暂无发票申请</div>
          </section>

          <section class="detail-section">
            <h3>订单时间线</h3>
            <div v-if="detailData.timeline.length" class="timeline">
              <div v-for="item in detailData.timeline" :key="item.type + item.time" class="timeline-item">
                <span>{{ fmt(item.time) }}</span>
                <strong>{{ item.label }}</strong>
              </div>
            </div>
            <div v-else class="empty">暂无可展示时间线</div>
          </section>

          <section v-if="canPostpayAction(detailData)" class="detail-section">
            <h3>可执行操作</h3>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <t-button theme="primary" :loading="postpayActionLoading" @click="postpayMarkPaid">标记后付款完成</t-button>
              <t-button theme="default" variant="outline" :loading="postpayActionLoading" @click="postpayOpenWaive">免除后付款</t-button>
            </div>
          </section>
        </div>
        <div v-else style="padding: 32px; color: #8A9288; text-align: center;">请选择订单查看详情</div>
      </t-loading>
    </t-drawer>

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

    <t-dialog v-model:visible="postpayWaiveVisible" header="免除后付款" :on-confirm="postpayConfirmWaive" :confirm-btn="{ content: '确认免除', loading: postpayActionLoading }">
      <div style="display: flex; flex-direction: column; gap: 10px; padding: 8px 0;">
        <div style="font-size: 13px; color: #8A9288;">免除后，该笔后付款不再计入应收金额。不会自动触发退款，也不会修改已经支付的金额。</div>
        <t-textarea v-model="postpayWaiveReason" placeholder="请填写免除原因（必填）" :autosize="{ minRows: 2, maxRows: 4 }" />
      </div>
    </t-dialog>
  </div>
</template>

<style scoped>
.detail-section {
  border: 1px solid #EDE9DF;
  border-radius: 8px;
  padding: 14px;
  background: #fff;
}
.detail-section h3 {
  margin: 0 0 12px;
  font-size: 15px;
  color: #18231E;
}
.detail-grid {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 8px 12px;
  font-size: 13px;
  color: #3E463F;
}
.detail-grid span,
.money-grid span {
  color: #8A9288;
}
.detail-grid strong,
.money-grid strong {
  color: #18231E;
  font-weight: 600;
  word-break: break-word;
}
.money-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
}
.money-grid div {
  border: 1px solid #F0EDE6;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.record-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.record-item {
  border: 1px solid #F0EDE6;
  border-radius: 8px;
  padding: 10px;
  font-size: 13px;
  color: #3E463F;
}
.record-item div:first-child {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.record-item p {
  margin: 6px 0 0;
  color: #8A9288;
}
.timeline {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.timeline-item {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 10px;
  font-size: 13px;
}
.timeline-item span {
  color: #8A9288;
}
.timeline-item strong {
  color: #18231E;
}
.empty {
  color: #8A9288;
  font-size: 13px;
  text-align: center;
  padding: 12px 0;
}
</style>
