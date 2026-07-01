<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { get } from '@/api/client'
import { assetUrl } from '@/config/api'

interface UserItem {
  userId: string; nickname: string | null; avatarUrl: string | null
  gender: string | null; phone: string | null
  birthYearMonth: string | null; age: number | null; identityType: string
  registrationCount: number; orderCount: number; checkedInCount: number
  paidAmount: number; refundedAmount: number; netAmount: number
  tags: { id: number; tag: string }[]
  registeredAt: string | null; lastLoginAt: string | null
  lastActivityTime: string | null
  inviteRegisterCount: number; inviteActivityCount: number
}
interface PageData { items: UserItem[]; total: number; page: number; limit: number }

const router = useRouter()
const list = ref<UserItem[]>([]); const total = ref(0)
const page = ref(1); const limit = ref(20); const loading = ref(false)
const keyword = ref(''); const tagFilter = ref('')
const birthYearMonth = ref(''); const registeredStart = ref(''); const registeredEnd = ref('')
const lastLoginStart = ref(''); const lastLoginEnd = ref('')
const inviteRegisterMin = ref<number | undefined>(undefined)
const inviteActivityMin = ref<number | undefined>(undefined)

const fetchList = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, limit: limit.value }
    if (keyword.value) params.keyword = keyword.value
    if (tagFilter.value) params.tag = tagFilter.value
    if (birthYearMonth.value) params.birthYearMonth = birthYearMonth.value
    if (registeredStart.value) params.registeredStart = registeredStart.value
    if (registeredEnd.value) params.registeredEnd = registeredEnd.value
    if (lastLoginStart.value) params.lastLoginStart = lastLoginStart.value
    if (lastLoginEnd.value) params.lastLoginEnd = lastLoginEnd.value
    if (inviteRegisterMin.value !== undefined) params.inviteRegisterMin = inviteRegisterMin.value
    if (inviteActivityMin.value !== undefined) params.inviteActivityMin = inviteActivityMin.value
    const data = await get<PageData>('/admin/crm/users', params)
    list.value = data.items; total.value = data.total
  } catch (e: any) {
    MessagePlugin.error(e?.response?.data?.message || '加载失败')
  } finally { loading.value = false }
}

const fmtDate = (s: string | null) => {
  if (!s) return '-'
  const d = new Date(s)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
const fmtYm = (s: string | null) => s || '-'
const yuan = (n: number) => '¥' + (n || 0).toFixed(2)
const genderLabel = (g: string | null) => ({ unknown: '未设置', '男': '男', '女': '女' } as any)[g || 'unknown'] || '-'

const onPageChange = (p: { current: number; pageSize: number }) => { page.value = p.current; limit.value = p.pageSize; fetchList() }
const onSearch = () => { page.value = 1; fetchList() }
const onReset = () => {
  keyword.value = ''; tagFilter.value = ''; birthYearMonth.value = ''
  registeredStart.value = ''; registeredEnd.value = ''
  lastLoginStart.value = ''; lastLoginEnd.value = ''
  inviteRegisterMin.value = undefined; inviteActivityMin.value = undefined
  onSearch()
}

const columns = [
  { colKey: 'avatarUrl', title: '头像', width: 60 },
  { colKey: 'userId', title: '用户ID', width: 120, cell: (_h: any, { row }: any) => {
    const uid = row.userId || '-'
    if (uid.length > 20) return uid.slice(0, 10) + '...' + uid.slice(-8)
    return uid
  } },
  { colKey: 'nickname', title: '昵称', width: 90, cell: (_h: any, { row }: any) => row.nickname || '-' },
  { colKey: 'gender', title: '性别', width: 60, cell: (_h: any, { row }: any) => genderLabel(row.gender) },
  { colKey: 'phone', title: '手机号', width: 110, cell: (_h: any, { row }: any) => row.phone || '-' },
  { colKey: 'birthYearMonth', title: '出生年月', width: 90, cell: (_h: any, { row }: any) => fmtYm(row.birthYearMonth) },
  { colKey: 'age', title: '年龄', width: 50, cell: (_h: any, { row }: any) => row.age !== null && row.age !== undefined ? row.age : '-' },
  { colKey: 'identityType', title: '类型', width: 70, cell: (_h: any, { row }: any) => row.identityType || '未设置' },
  { colKey: 'registeredAt', title: '注册时间', width: 130, cell: (_h: any, { row }: any) => fmtDate(row.registeredAt) },
  { colKey: 'lastLoginAt', title: '最近登录', width: 130, cell: (_h: any, { row }: any) => fmtDate(row.lastLoginAt) },
  { colKey: 'registrationCount', title: '报名', width: 50 },
  { colKey: 'orderCount', title: '订单', width: 50 },
  { colKey: 'checkedInCount', title: '签到', width: 50 },
  { colKey: 'paidAmount', title: '累计支付', width: 90, cell: (_h: any, { row }: any) => yuan(row.paidAmount) },
  { colKey: 'refundedAmount', title: '累计退款', width: 90, cell: (_h: any, { row }: any) => yuan(row.refundedAmount) },
  { colKey: 'tags', title: '标签', width: 120, cell: (_h: any, { row }: any) => row.tags?.length ? row.tags.map((t: any) => t.tag).join(', ') : '-' },
  { colKey: 'inviteRegisterCount', title: '邀请注册', width: 70 },
  { colKey: 'inviteActivityCount', title: '邀请活动', width: 70 },
  { colKey: 'actions', title: '操作', width: 90, fixed: 'right' as const },
]

onMounted(fetchList)
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h2 style="font-size: 24px; font-weight: 700; color: #18231E; margin: 0;">用户运营</h2>
    </div>

    <div style="background: #FFFFFF; border-radius: 12px; border: 1px solid #EDE9DF; padding: 16px; margin-bottom: 16px;">
      <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
        <t-input v-model="keyword" placeholder="搜索用户ID" clearable style="width: 170px;" @enter="onSearch" />
        <t-input v-model="tagFilter" placeholder="按标签筛选" clearable style="width: 140px;" @enter="onSearch" />
        <t-input v-model="birthYearMonth" placeholder="出生年月 YYYY-MM" clearable style="width: 160px;" @enter="onSearch" />
        <span style="color: #8A9288; font-size: 12px;">注册</span>
        <t-date-picker v-model="registeredStart" placeholder="开始" clearable style="width: 140px;" @change="onSearch" />
        <t-date-picker v-model="registeredEnd" placeholder="结束" clearable style="width: 140px;" @change="onSearch" />
        <span style="color: #8A9288; font-size: 12px;">登录</span>
        <t-date-picker v-model="lastLoginStart" placeholder="开始" clearable style="width: 140px;" @change="onSearch" />
        <t-date-picker v-model="lastLoginEnd" placeholder="结束" clearable style="width: 140px;" @change="onSearch" />
        <span style="color: #8A9288; font-size: 12px;">邀请注册≥</span>
        <t-input-number v-model="inviteRegisterMin" :min="0" placeholder="0" style="width: 80px;" @change="onSearch" />
        <span style="color: #8A9288; font-size: 12px;">邀请活动≥</span>
        <t-input-number v-model="inviteActivityMin" :min="0" placeholder="0" style="width: 80px;" @change="onSearch" />
        <t-button theme="primary" @click="onSearch">搜索</t-button>
        <t-button theme="default" variant="outline" @click="onReset">重置</t-button>
      </div>
    </div>

    <div style="background: #FFFFFF; border-radius: 12px; border: 1px solid #EDE9DF; overflow-x: auto;">
      <t-table :data="list" :columns="columns" row-key="userId" hover stripe size="small" :loading="loading"
        :pagination="{ current: page, pageSize: limit, total, showJumper: true }" @page-change="onPageChange">
        <template #avatarUrl="{ row }">
          <img v-if="row.avatarUrl" :src="assetUrl(row.avatarUrl)" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" />
          <div v-else style="width:32px;height:32px;border-radius:50%;background:#EEF5EF;display:flex;align-items:center;justify-content:center;font-size:13px;color:#7A8178;">-</div>
        </template>
        <template #actions="{ row }">
          <t-button theme="default" variant="text" size="small" style="color: #2E7D5A;" @click="router.push('/crm/users/' + row.userId)">查看详情</t-button>
        </template>
      </t-table>
    </div>
  </div>
</template>
