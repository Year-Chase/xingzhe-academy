<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next'
import { get, patch } from '@/api/client'

interface InvoiceItem {
  id: number; orderId: number; userId: string; activityId: number
  title: string; taxNo: string; invoiceType: string; amount: number; status: string
  createdAt: string; issuedAt: string; userNickname?: string; userPhone?: string
  activityTitle?: string; companyAddress?: string; companyPhone?: string
  bankName?: string; bankAccount?: string; email?: string; remark?: string
}
interface PageData { items: InvoiceItem[]; total: number; page: number; limit: number }

const list = ref<InvoiceItem[]>([]); const total = ref(0); const page = ref(1); const limit = ref(20); const loading = ref(false)
const detailVisible = ref(false); const detailLoading = ref(false); const detail = ref<InvoiceItem | null>(null)

const fetchList = async () => {
  loading.value = true
  try { const data = await get<PageData>('/admin/invoices', { page: page.value, limit: limit.value }); list.value = data.items; total.value = data.total }
  catch (e: any) { MessagePlugin.error(e?.response?.data?.message || '加载失败') }
  finally { loading.value = false }
}

const fmt = (s: string) => s ? new Date(s).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'
const money = (n: number | string | null | undefined) => `¥${Number(n || 0).toFixed(2)}`
const statusLabel = (s: string) => ({ REQUESTED: '待开票', PENDING: '待开票', ISSUED: '已开票', CANCELED: '已取消', REFUNDED: '已退款' } as any)[s] || s
const typeLabel = (s: string) => s === 'COMPANY' ? '企业' : '个人'
const onPageChange = (p: { current: number; pageSize: number }) => { page.value = p.current; limit.value = p.pageSize; fetchList() }
const doIssue = async (row: InvoiceItem) => {
  const dlg = DialogPlugin.confirm({
    header: '标记已开票',
    body: '确认将该申请标记为已开票？',
    onConfirm: async () => {
      dlg.hide()
      try { await patch('/admin/invoices/' + row.id + '/issue', {}); MessagePlugin.success('已标记开票'); fetchList(); if (detail.value?.id === row.id) openDetail(row) }
      catch (e: any) { MessagePlugin.error(e?.response?.data?.message || '操作失败') }
    },
  })
}
const openDetail = async (row: InvoiceItem) => {
  detailVisible.value = true; detailLoading.value = true
  try { detail.value = await get<InvoiceItem>('/admin/invoices/' + row.id) }
  catch (e: any) { MessagePlugin.error(e?.response?.data?.message || '加载详情失败'); detail.value = row }
  finally { detailLoading.value = false }
}

const columns = [
  { colKey: 'id', title: 'ID', width: 60 },
  { colKey: 'createdAt', title: '申请时间', width: 130, cell: (_h: any, { row }: any) => fmt(row.createdAt) },
  { colKey: 'userNickname', title: '用户', width: 120, cell: (_h: any, { row }: any) => row.userNickname || row.userPhone || row.userId || '-' },
  { colKey: 'orderId', title: '订单号', width: 70 },
  { colKey: 'activityTitle', title: '活动', width: 160, ellipsis: true },
  { colKey: 'title', title: '抬头', width: 180, ellipsis: true },
  { colKey: 'invoiceType', title: '类型', width: 70, cell: (_h: any, { row }: any) => typeLabel(row.invoiceType) },
  { colKey: 'taxNo', title: '税号', width: 140, ellipsis: true },
  { colKey: 'amount', title: '金额', width: 80, cell: (_h: any, { row }: any) => money(row.amount) },
  { colKey: 'status', title: '状态', width: 80, cell: (_h: any, { row }: any) => statusLabel(row.status) },
  { colKey: 'issuedAt', title: '开票', width: 130, cell: (_h: any, { row }: any) => fmt(row.issuedAt) },
  { colKey: 'actions', title: '操作', width: 140 },
]

onMounted(fetchList)
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h2 style="font-size: 24px; font-weight: 700; color: #18231E; margin: 0;">发票管理</h2>
    </div>
    <div style="background: #FFFFFF; border-radius: 12px; border: 1px solid #EDE9DF; overflow-x: auto;">
      <t-table :data="list" :columns="columns" row-key="id" hover stripe size="small" :loading="loading"
        :pagination="{ current: page, pageSize: limit, total, showJumper: true }" @page-change="onPageChange">
        <template #actions="{ row }">
          <t-button theme="default" variant="text" size="small" style="color: #2E7D5A;" @click="openDetail(row)">查看</t-button>
          <t-button v-if="row.status === 'REQUESTED'" theme="default" variant="text" size="small" style="color: #2E7D5A;" @click="doIssue(row)">标记已开票</t-button>
        </template>
      </t-table>
    </div>

    <t-dialog v-model:visible="detailVisible" header="发票申请详情" width="560px" :footer="false">
      <t-loading :loading="detailLoading">
        <div v-if="detail" style="display: grid; grid-template-columns: 96px 1fr; gap: 10px 14px; color: #3E463F; font-size: 14px; line-height: 1.7;">
          <span style="color:#8A9288;">申请ID</span><span>{{ detail.id }}</span>
          <span style="color:#8A9288;">状态</span><span>{{ statusLabel(detail.status) }}</span>
          <span style="color:#8A9288;">申请时间</span><span>{{ fmt(detail.createdAt) }}</span>
          <span style="color:#8A9288;">处理时间</span><span>{{ fmt(detail.issuedAt) }}</span>
          <span style="color:#8A9288;">用户</span><span>{{ detail.userNickname || '-' }} {{ detail.userPhone ? ' / ' + detail.userPhone : '' }}</span>
          <span style="color:#8A9288;">订单</span><span>{{ detail.orderId }}</span>
          <span style="color:#8A9288;">活动</span><span>{{ detail.activityTitle || '-' }}</span>
          <span style="color:#8A9288;">金额</span><span>{{ money(detail.amount) }}</span>
          <span style="color:#8A9288;">发票类型</span><span>{{ typeLabel(detail.invoiceType) }}</span>
          <span style="color:#8A9288;">发票抬头</span><span>{{ detail.title }}</span>
          <span style="color:#8A9288;">税号</span><span>{{ detail.taxNo || '-' }}</span>
          <span style="color:#8A9288;">单位地址</span><span>{{ detail.companyAddress || '-' }}</span>
          <span style="color:#8A9288;">单位电话</span><span>{{ detail.companyPhone || '-' }}</span>
          <span style="color:#8A9288;">开户行</span><span>{{ detail.bankName || '-' }}</span>
          <span style="color:#8A9288;">银行账号</span><span>{{ detail.bankAccount || '-' }}</span>
          <span style="color:#8A9288;">接收邮箱</span><span>{{ detail.email || '-' }}</span>
          <span style="color:#8A9288;">备注</span><span>{{ detail.remark || '-' }}</span>
        </div>
        <div v-else style="padding: 32px; text-align:center; color:#8A9288;">暂无详情</div>
      </t-loading>
      <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:20px;">
        <t-button theme="default" @click="detailVisible = false">关闭</t-button>
        <t-button v-if="detail?.status === 'REQUESTED'" theme="primary" @click="doIssue(detail)">标记已开票</t-button>
      </div>
    </t-dialog>
  </div>
</template>
