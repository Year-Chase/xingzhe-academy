<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { get, patch } from '@/api/client'

interface InvoiceItem { id: number; orderId: number; userId: string; activityId: number; title: string; taxNo: string; amount: number; status: string; createdAt: string; issuedAt: string }
interface PageData { items: InvoiceItem[]; total: number; page: number; limit: number }

const list = ref<InvoiceItem[]>([]); const total = ref(0); const page = ref(1); const limit = ref(20); const loading = ref(false)

const fetchList = async () => {
  loading.value = true
  try { const data = await get<PageData>('/admin/invoices', { page: page.value, limit: limit.value }); list.value = data.items; total.value = data.total }
  catch (e: any) { MessagePlugin.error(e?.response?.data?.message || '加载失败') }
  finally { loading.value = false }
}

const fmt = (s: string) => s ? new Date(s).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'
const onPageChange = (p: { current: number; pageSize: number }) => { page.value = p.current; limit.value = p.pageSize; fetchList() }
const doIssue = async (row: InvoiceItem) => {
  try { await patch('/admin/invoices/' + row.id + '/issue', {}); MessagePlugin.success('已标记开票'); fetchList() }
  catch (e: any) { MessagePlugin.error(e?.response?.data?.message || '操作失败') }
}

const columns = [
  { colKey: 'id', title: 'ID', width: 60 },
  { colKey: 'orderId', title: '订单', width: 60 },
  { colKey: 'title', title: '抬头', width: 180, ellipsis: true },
  { colKey: 'taxNo', title: '税号', width: 140, ellipsis: true },
  { colKey: 'amount', title: '金额', width: 80, cell: (_h: any, { row }: any) => `¥${row.amount}` },
  { colKey: 'status', title: '状态', width: 80 },
  { colKey: 'createdAt', title: '创建', width: 130, cell: (_h: any, { row }: any) => fmt(row.createdAt) },
  { colKey: 'issuedAt', title: '开票', width: 130, cell: (_h: any, { row }: any) => fmt(row.issuedAt) },
  { colKey: 'actions', title: '操作', width: 100 },
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
          <t-button v-if="row.status === 'REQUESTED'" theme="default" variant="text" size="small" style="color: #2E7D5A;" @click="doIssue(row)">开票</t-button>
        </template>
      </t-table>
    </div>
  </div>
</template>
