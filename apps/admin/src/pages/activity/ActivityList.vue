<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { get, post, patch } from '@/api/client'

// ── types ──
interface ActivityItem {
  id: number; title: string; slogan: string; description: string; location: string; city: string
  startTime: string; endTime: string; registrationStartTime: string; registrationEndTime: string
  capacity: number; registeredCount: number; status: string; coverImage: string
  price: number; memberPrice: number; lifetimeMemberPrice: number; paymentMode: string; createdAt: string
}
interface PageData { items: ActivityItem[]; total: number; page: number; limit: number }
interface FormData {
  title: string; slogan: string; description: string; location: string; city: string
  startTime: string; endTime: string; registrationStartTime: string; registrationEndTime: string
  capacity: number; coverImage: string; price: number; memberPrice: number; lifetimeMemberPrice: number; paymentMode: string
}

// ── state ──
const list = ref<ActivityItem[]>([])
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const loading = ref(false)
const error = ref('')
const keyword = ref('')
const statusFilter = ref('')
const detailVisible = ref(false)
const detailItem = ref<ActivityItem | null>(null)
const formDrawer = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const formId = ref(0)
const formLoading = ref(false)
const formError = ref('')
const uploadLoading = ref(false)
const coverPreview = ref('')
// Original values for time fields (ISO strings) — used to detect changes in edit mode
const origStart = ref(''); const origEnd = ref(''); const origRegStart = ref(''); const origRegEnd = ref('')
const form = reactive<FormData>({
  title: '', slogan: '', description: '', location: '', city: '',
  startTime: '', endTime: '', registrationStartTime: '', registrationEndTime: '',
  capacity: 30, coverImage: '', price: 0, memberPrice: 0, lifetimeMemberPrice: 0, paymentMode: 'FULL',
})

const statusOptions = [
  { label: '全部', value: '' }, { label: '未发布', value: 'DRAFT' },
  { label: '已发布', value: 'PUBLISHED' }, { label: '已下架', value: 'CLOSED' },
]

// ── helpers ──
const statusLabel = (s: string) => ({ PUBLISHED: '已发布', DRAFT: '未发布', CLOSED: '已下架', ENDED: '已结束' } as any)[s] || s
const statusColor = (s: string) => ({ PUBLISHED: '#2E7D5A', DRAFT: '#8A9288', CLOSED: '#B35B4B', ENDED: '#8A9288' } as any)[s] || '#666'
const fmt = (s: string) => s ? new Date(s).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'
const toLocal = (s: string) => {
  if (!s) return ''
  const d = new Date(s)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

// ── fetch list ──
const fetchList = async () => {
  loading.value = true; error.value = ''
  try {
    const data = await get<PageData>('/admin/activity', { page: page.value, limit: limit.value, keyword: keyword.value || undefined, status: statusFilter.value || undefined })
    list.value = data.items; total.value = data.total
  } catch (e: any) { error.value = e?.response?.data?.message || e?.message || '加载失败' }
  finally { loading.value = false }
}
const onPageChange = (p: { current: number; pageSize: number }) => { page.value = p.current; limit.value = p.pageSize; fetchList() }
const onSearch = () => { page.value = 1; fetchList() }

// ── detail ──
const openDetail = async (row: ActivityItem) => {
  detailVisible.value = true; detailItem.value = null
  try { detailItem.value = await get<ActivityItem>('/admin/activity/' + row.id) } catch { detailItem.value = row }
}

// ── upload ──
const handleUpload = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input?.files?.[0]
  if (!file) return
  uploadLoading.value = true
  try {
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch('/api/admin/activity/upload-cover', { method: 'POST', body: fd })
    const data = await res.json()
    form.coverImage = data.url
    coverPreview.value = data.url
    MessagePlugin.success('上传成功')
  } catch { MessagePlugin.error('上传失败') }
  finally { uploadLoading.value = false }
}

// ── create / edit ──
const resetForm = () => {
  form.title = ''; form.slogan = ''; form.description = ''; form.location = ''; form.city = ''
  form.startTime = ''; form.endTime = ''; form.registrationStartTime = ''; form.registrationEndTime = ''
  form.capacity = 30; form.coverImage = ''; form.price = 0; form.memberPrice = 0; form.lifetimeMemberPrice = 0; form.paymentMode = 'FULL'
  coverPreview.value = ''; formError.value = ''
}
const openCreate = () => { resetForm(); formMode.value = 'create'; formId.value = 0; formDrawer.value = true }
const openEdit = (row: ActivityItem) => {
  formMode.value = 'edit'; formId.value = row.id
  form.title = row.title; form.slogan = row.slogan || ''; form.description = row.description || ''; form.location = row.location || ''
  form.city = row.city || ''; form.capacity = row.capacity
  form.price = row.price ?? 0; form.memberPrice = row.memberPrice ?? 0; form.lifetimeMemberPrice = row.lifetimeMemberPrice ?? 0
  form.startTime = toLocal(row.startTime); form.endTime = toLocal(row.endTime)
  form.registrationStartTime = toLocal(row.registrationStartTime); form.registrationEndTime = toLocal(row.registrationEndTime)
  form.coverImage = row.coverImage || ''; coverPreview.value = row.coverImage || ''
  // Store original ISO strings for time fields — used as fallback in edit mode to avoid timezone drift
  origStart.value = row.startTime || ''
  origEnd.value = row.endTime || ''
  origRegStart.value = row.registrationStartTime || ''
  origRegEnd.value = row.registrationEndTime || ''
  formError.value = ''; formDrawer.value = true
}
const submitForm = async () => {
  if (!form.title || !form.location || !form.startTime || !form.endTime || !form.registrationStartTime || !form.registrationEndTime || !form.capacity || form.capacity <= 0) {
    formError.value = '标题、地点、活动开始/结束时间、报名开始/结束时间、人数（>0）为必填项'; return
  }
  if (new Date(form.endTime) <= new Date(form.startTime)) { formError.value = '活动结束时间必须晚于活动开始时间'; return }
  if (new Date(form.registrationEndTime) <= new Date(form.registrationStartTime)) { formError.value = '报名结束时间必须晚于报名开始时间'; return }
  formLoading.value = true; formError.value = ''
  const body: any = {
    title: form.title, slogan: form.slogan || undefined, description: form.description, location: form.location, city: form.city || undefined,
    capacity: form.capacity, coverImage: form.coverImage || undefined,
    price: form.price, memberPrice: form.memberPrice, lifetimeMemberPrice: form.lifetimeMemberPrice,
  }
  // Time fields: use original ISO strings if user did not edit them (avoid timezone round-trip drift)
  if (formMode.value === 'edit') {
    body.startTime = form.startTime !== toLocal(origStart.value) ? new Date(form.startTime).toISOString() : origStart.value
    body.endTime = form.endTime !== toLocal(origEnd.value) ? new Date(form.endTime).toISOString() : origEnd.value
    body.registrationStartTime = form.registrationStartTime !== toLocal(origRegStart.value) ? new Date(form.registrationStartTime).toISOString() : origRegStart.value
    body.registrationEndTime = form.registrationEndTime !== toLocal(origRegEnd.value) ? new Date(form.registrationEndTime).toISOString() : origRegEnd.value
  } else {
    body.startTime = new Date(form.startTime).toISOString()
    body.endTime = new Date(form.endTime).toISOString()
    body.registrationStartTime = new Date(form.registrationStartTime).toISOString()
    body.registrationEndTime = new Date(form.registrationEndTime).toISOString()
  }
  try {
    if (formMode.value === 'create') { await post('/admin/activity', body) }
    else { await patch('/admin/activity/' + formId.value, body) }
    MessagePlugin.success(formMode.value === 'create' ? '创建成功' : '编辑成功')
    formDrawer.value = false; fetchList()
  } catch (e: any) { formError.value = e?.response?.data?.message || e?.message || '操作失败' }
  finally { formLoading.value = false }
}

// ── publish / close ──
const doPublish = (row: ActivityItem) => {
  const dlg = DialogPlugin.confirm({
    header: '确认发布', body: `确认发布「${row.title}」？发布后小程序首页将展示该活动。`,
    onConfirm: async () => {
      dlg.hide()
      try { await post('/admin/activity/' + row.id + '/publish'); MessagePlugin.success('已发布'); fetchList() }
      catch (e: any) { MessagePlugin.error(e?.response?.data?.message || '发布失败') }
    },
  })
}
const doClose = (row: ActivityItem) => {
  const dlg = DialogPlugin.confirm({
    header: '确认下架', body: `确认下架「${row.title}」？下架后小程序首页不再展示该活动，但已报名用户数据不会删除。`,
    onConfirm: async () => {
      dlg.hide()
      try { await post('/admin/activity/' + row.id + '/close'); MessagePlugin.success('已下架'); fetchList() }
      catch (e: any) { MessagePlugin.error(e?.response?.data?.message || '下架失败') }
    },
  })
}

const columns = [
  { colKey: 'id', title: 'ID', width: 60 },
  { colKey: 'title', title: '标题', width: 140, ellipsis: true },
  { colKey: 'city', title: '城市', width: 70, cell: (_h: any, { row }: any) => row.city || '—' },
  { colKey: 'location', title: '地点', width: 120, ellipsis: true },
  { colKey: 'registrationStartTime', title: '报名开始', width: 130, cell: (_h: any, { row }: any) => fmt(row.registrationStartTime) },
  { colKey: 'registrationEndTime', title: '报名结束', width: 130, cell: (_h: any, { row }: any) => fmt(row.registrationEndTime) },
  { colKey: 'startTime', title: '活动开始', width: 130, cell: (_h: any, { row }: any) => fmt(row.startTime) },
  { colKey: 'endTime', title: '活动结束', width: 130, cell: (_h: any, { row }: any) => fmt(row.endTime) },
  { colKey: 'registeredCount', title: '报名', width: 70, cell: (_h: any, { row }: any) => `${row.registeredCount}/${row.capacity}` },
  { colKey: 'status', title: '状态', width: 80 },
  { colKey: 'actions', title: '操作', width: 220, fixed: 'right' as const },
]

onMounted(fetchList)
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h2 style="font-size: 24px; font-weight: 700; color: #18231E; margin: 0;">活动管理</h2>
      <t-button @click="openCreate" style="background: #2E7D5A; border-color: #2E7D5A; color: #fff;">+ 新建活动</t-button>
    </div>

    <div style="display: flex; gap: 12px; margin-bottom: 16px;">
      <t-input v-model="keyword" placeholder="搜索标题/地点/描述" clearable @enter="onSearch" style="width: 260px;" />
      <t-select v-model="statusFilter" :options="statusOptions" style="width: 120px;" @change="onSearch" />
      <t-button @click="onSearch" style="background: #2E7D5A; border-color: #2E7D5A; color: #fff;">搜索</t-button>
    </div>

    <div style="background: #FFFFFF; border-radius: 12px; border: 1px solid #EDE9DF; overflow-x: auto;">
      <t-table
        :data="list" :columns="columns" row-key="id" hover stripe size="small"
        :loading="loading"
        :pagination="{ current: page, pageSize: limit, total, showJumper: true }"
        @page-change="onPageChange"
        table-layout="auto"
      >
        <template #status="{ row }">
          <span :style="{ color: statusColor(row.status), fontSize: '13px', fontWeight: 500 }">{{ statusLabel(row.status) }}</span>
        </template>
        <template #actions="{ row }">
          <t-space size="small">
            <t-button theme="default" variant="text" size="small" @click="openDetail(row)">查看</t-button>
            <t-button theme="default" variant="text" size="small" @click="openEdit(row)">编辑</t-button>
            <t-button v-if="row.status === 'DRAFT'" theme="default" variant="text" size="small" style="color: #2E7D5A;" @click="doPublish(row)">发布</t-button>
            <t-button v-if="row.status === 'PUBLISHED'" theme="default" variant="text" size="small" style="color: #B35B4B;" @click="doClose(row)">下架</t-button>
            <t-button v-if="row.status === 'CLOSED'" theme="default" variant="text" size="small" style="color: #2E7D5A;" @click="doPublish(row)">重新发布</t-button>
          </t-space>
        </template>
        <template #empty>
          <div style="padding: 48px 0; text-align: center; color: #8A9288;">{{ error || (keyword ? '无匹配活动' : '暂无活动') }}</div>
        </template>
      </t-table>
    </div>

    <!-- detail drawer -->
    <t-drawer v-model:visible="detailVisible" header="活动详情" size="480px" :footer="false">
      <div v-if="detailItem" style="display: flex; flex-direction: column; gap: 14px; font-size: 14px;">
        <div><label style="color: #8A9288;">活动名称</label><div style="color: #18231E; font-weight: 600; margin-top: 4px;">{{ detailItem.title }}</div></div>
        <div v-if="detailItem.slogan"><label style="color: #8A9288;">Slogan</label><div style="color: #3F6B4F; margin-top: 4px;">{{ detailItem.slogan }}</div></div>
        <div><label style="color: #8A9288;">描述</label><div style="color: #333A34; margin-top: 4px;">{{ detailItem.description || '—' }}</div></div>
        <div><label style="color: #8A9288;">地点</label><div style="color: #333A34; margin-top: 4px;">{{ detailItem.location || '—' }} {{ detailItem.city ? ' / ' + detailItem.city : '' }}</div></div>
        <div><label style="color: #8A9288;">活动时间</label><div style="color: #333A34; margin-top: 4px;">{{ fmt(detailItem.startTime) }} ~ {{ detailItem.endTime ? fmt(detailItem.endTime) : '—' }}</div></div>
        <div><label style="color: #8A9288;">报名时间</label><div style="color: #333A34; margin-top: 4px;">{{ fmt(detailItem.registrationStartTime) }} ~ {{ fmt(detailItem.registrationEndTime) }}</div></div>
        <div><label style="color: #8A9288;">名额 / 价格</label><div style="color: #333A34; margin-top: 4px;">{{ detailItem.registeredCount }}/{{ detailItem.capacity }} 人 · ¥{{ detailItem.price ?? 0 }}</div></div>
        <div><label style="color: #8A9288;">状态</label><div style="margin-top: 4px;"><span :style="{ color: statusColor(detailItem.status), fontWeight: 500 }">{{ statusLabel(detailItem.status) }}</span></div></div>
      </div>
      <div v-else style="text-align: center; color: #8A9288; padding: 32px 0;">加载中...</div>
    </t-drawer>

    <!-- create / edit drawer -->
    <t-drawer v-model:visible="formDrawer" :header="formMode === 'create' ? '新建活动' : '编辑活动'" size="640px" :footer="false">
      <div style="display: flex; flex-direction: column; gap: 14px; padding-bottom: 16px;">
        <div><label style="color: #8A9288; font-size: 13px;">活动标题 *</label><t-input v-model="form.title" placeholder="例如：晨跑打卡" /></div>
        <div><label style="color: #8A9288; font-size: 13px;">活动 slogan</label><t-input v-model="form.slogan" placeholder="少于100字，例如：把身体从屏幕里带出来" maxlength="100" /></div>
        <div><label style="color: #8A9288; font-size: 13px;">描述</label><t-textarea v-model="form.description" placeholder="活动详细描述" :autosize="{ minRows: 2, maxRows: 4 }" /></div>
        <div style="display: flex; gap: 12px;">
          <div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">活动地点 *</label><t-input v-model="form.location" placeholder="例如：北京奥森" /></div>
          <div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">城市</label><t-input v-model="form.city" placeholder="例如：北京" /></div>
        </div>
        <div style="display: flex; gap: 12px;">
          <div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">活动开始时间 *</label><t-input v-model="form.startTime" type="datetime-local" /></div>
          <div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">活动结束时间 *</label><t-input v-model="form.endTime" type="datetime-local" /></div>
        </div>
        <div style="display: flex; gap: 12px;">
          <div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">报名开始时间 *</label><t-input v-model="form.registrationStartTime" type="datetime-local" /></div>
          <div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">报名结束时间 *</label><t-input v-model="form.registrationEndTime" type="datetime-local" /></div>
        </div>
        <div style="display: flex; gap: 12px;">
          <div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">人数上限 *</label><t-input-number v-model="form.capacity" :min="1" style="width: 100%;" /></div>
          <div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">普通价格 ¥</label><t-input-number v-model="form.price" :min="0" style="width: 100%;" /></div>
        </div>
        <div style="display: flex; gap: 12px;">
          <div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">会员价格 ¥</label><t-input-number v-model="form.memberPrice" :min="0" style="width: 100%;" /></div>
          <div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">终身会员价格 ¥</label><t-input-number v-model="form.lifetimeMemberPrice" :min="0" style="width: 100%;" /></div>
        </div>
        <div><label style="color: #8A9288; font-size: 13px;">封面图</label>
          <div style="display: flex; align-items: center; gap: 12px; margin-top: 4px;">
            <input type="file" accept="image/jpeg,image/png,image/webp" @change="handleUpload" style="font-size: 13px;" />
            <t-button size="small" :loading="uploadLoading" disabled>上传中...</t-button>
          </div>
          <div v-if="coverPreview" style="margin-top: 8px;">
            <img :src="'http://127.0.0.1:3000' + coverPreview" style="max-width: 200px; max-height: 120px; border-radius: 8px; border: 1px solid #EDE9DF;" />
          </div>
          <div v-if="form.coverImage && !coverPreview" style="margin-top: 4px; font-size: 12px; color: #8A9288;">{{ form.coverImage }}</div>
        </div>
        <div v-if="formError" style="color: #B35B4B; font-size: 13px; margin-top: 4px;">{{ formError }}</div>
        <div style="display: flex; gap: 12px; margin-top: 16px;">
          <t-button @click="formDrawer = false" style="flex: 1; height: 40px;">取消</t-button>
          <t-button @click="submitForm" :loading="formLoading" style="flex: 1; height: 40px; background: #2E7D5A; border-color: #2E7D5A; color: #fff;">{{ formMode === 'create' ? '创建' : '保存' }}</t-button>
        </div>
      </div>
    </t-drawer>
  </div>
</template>
