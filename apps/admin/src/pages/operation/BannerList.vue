<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next'
import { assetUrl, API_BASE_URL } from '@/config/api'
import { del, get, patch, post } from '@/api/client'

interface BannerItem {
  id: string
  imageUrl: string
  title: string
  description: string | null
  sortOrder: number
  status: 'ACTIVE' | 'INACTIVE'
  startAt: string | null
  endAt: string | null
  jumpType: 'NONE' | 'ACTIVITY' | 'CATEGORY' | 'SERIES'
  jumpValue: string | null
  updatedAt: string
}

const list = ref<BannerItem[]>([])
const loading = ref(false)
const drawerVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const formId = ref('')
const formError = ref('')
const formLoading = ref(false)
const uploadLoading = ref(false)
const activities = ref<any[]>([])
const categories = ref<any[]>([])

const form = reactive({
  imageUrl: '',
  title: '',
  description: '',
  sortOrder: 0,
  status: 'ACTIVE',
  startAt: '',
  endAt: '',
  jumpType: 'NONE',
  jumpValue: '',
})

const statusOptions = [
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'INACTIVE' },
]

const jumpTypeOptions = [
  { label: '无跳转', value: 'NONE' },
  { label: '活动详情', value: 'ACTIVITY' },
  { label: '活动主题', value: 'CATEGORY' },
  { label: '活动系列（预留）', value: 'SERIES', disabled: true },
]

const fmt = (s: string | null) => {
  if (!s) return '-'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const toLocal = (s: string | null) => {
  if (!s) return ''
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return ''
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16)
}

const fromLocal = (s: string) => s ? new Date(s).toISOString() : null

const jumpLabel = (row: BannerItem) => {
  if (row.jumpType === 'NONE') return '无跳转'
  if (row.jumpType === 'ACTIVITY') {
    const item = activities.value.find((a: any) => String(a.id) === String(row.jumpValue))
    return item ? `活动：${item.title}` : `活动：${row.jumpValue || '-'}`
  }
  if (row.jumpType === 'CATEGORY') {
    const item = categories.value.find((c: any) => String(c.id) === String(row.jumpValue))
    return item ? `主题：${item.name}` : `主题：${row.jumpValue || '-'}`
  }
  return '活动系列（预留）'
}

const fetchList = async () => {
  loading.value = true
  try { list.value = await get<BannerItem[]>('/admin/operation/banners') }
  catch (e: any) { MessagePlugin.error(e?.response?.data?.message || 'Banner加载失败') }
  finally { loading.value = false }
}

const fetchOptions = async () => {
  try {
    const [activityPage, categoryList] = await Promise.all([
      get<any>('/admin/activity', { page: 1, limit: 100 }),
      get<any[]>('/admin/activity/categories'),
    ])
    activities.value = Array.isArray(activityPage?.items) ? activityPage.items : []
    categories.value = Array.isArray(categoryList) ? categoryList : []
  } catch (_e) {
    activities.value = []
    categories.value = []
  }
}

const resetForm = () => {
  form.imageUrl = ''
  form.title = ''
  form.description = ''
  form.sortOrder = 0
  form.status = 'ACTIVE'
  form.startAt = ''
  form.endAt = ''
  form.jumpType = 'NONE'
  form.jumpValue = ''
  formError.value = ''
}

const openCreate = () => {
  resetForm()
  formMode.value = 'create'
  formId.value = ''
  drawerVisible.value = true
}

const openEdit = (row: BannerItem) => {
  formMode.value = 'edit'
  formId.value = row.id
  form.imageUrl = row.imageUrl || ''
  form.title = row.title || ''
  form.description = row.description || ''
  form.sortOrder = Number(row.sortOrder || 0)
  form.status = row.status || 'ACTIVE'
  form.startAt = toLocal(row.startAt)
  form.endAt = toLocal(row.endAt)
  form.jumpType = row.jumpType || 'NONE'
  form.jumpValue = row.jumpValue || ''
  formError.value = ''
  drawerVisible.value = true
}

const submitForm = async () => {
  const imageUrl = form.imageUrl.trim()
  const title = form.title.trim()
  if (!imageUrl) { formError.value = '请上传或填写Banner图片'; return }
  if (!title) { formError.value = 'Banner标题不能为空'; return }
  if (form.jumpType !== 'NONE' && !String(form.jumpValue || '').trim()) { formError.value = '请选择跳转目标'; return }
  if (form.jumpType === 'SERIES') { formError.value = '活动系列为预留能力，当前版本暂不可配置'; return }
  const body = {
    imageUrl,
    title,
    description: form.description.trim() || null,
    sortOrder: Number(form.sortOrder || 0),
    status: form.status,
    startAt: fromLocal(form.startAt),
    endAt: fromLocal(form.endAt),
    jumpType: form.jumpType,
    jumpValue: form.jumpType === 'NONE' ? null : String(form.jumpValue || ''),
  }
  formLoading.value = true
  formError.value = ''
  try {
    if (formMode.value === 'create') await post('/admin/operation/banners', body)
    else await patch('/admin/operation/banners/' + formId.value, body)
    MessagePlugin.success(formMode.value === 'create' ? 'Banner已创建' : 'Banner已保存')
    drawerVisible.value = false
    fetchList()
  } catch (e: any) {
    formError.value = e?.response?.data?.message || e?.message || '保存失败'
  } finally {
    formLoading.value = false
  }
}

const uploadImage = async (e: Event) => {
  const file = (e.target as HTMLInputElement)?.files?.[0]
  if (!file) return
  uploadLoading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const token = localStorage.getItem('admin_token')
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`${API_BASE_URL}/admin/activity/upload-cover`, { method: 'POST', headers, body: fd })
    const data = await res.json()
    if (!data?.url) throw new Error('未获取到图片地址')
    form.imageUrl = data.url
    MessagePlugin.success('上传成功')
  } catch (err: any) {
    MessagePlugin.error(err?.message || '上传失败')
  } finally {
    uploadLoading.value = false
    ;(e.target as HTMLInputElement).value = ''
  }
}

const removeBanner = (row: BannerItem) => {
  const dlg = DialogPlugin.confirm({
    header: '删除Banner',
    body: `确认删除「${row.title}」？删除后首页将不再展示该运营位。`,
    onConfirm: async () => {
      dlg.hide()
      try {
        await del('/admin/operation/banners/' + row.id)
        MessagePlugin.success('已删除')
        fetchList()
      } catch (e: any) {
        MessagePlugin.error(e?.response?.data?.message || '删除失败')
      }
    },
  })
}

const columns = [
  { colKey: 'imageUrl', title: '图片', width: 110 },
  { colKey: 'title', title: '标题', width: 150, ellipsis: true },
  { colKey: 'jump', title: '跳转', width: 180, cell: (_h: any, { row }: any) => jumpLabel(row) },
  { colKey: 'status', title: '状态', width: 80 },
  { colKey: 'sortOrder', title: '排序', width: 70 },
  { colKey: 'startAt', title: '开始时间', width: 150, cell: (_h: any, { row }: any) => fmt(row.startAt) },
  { colKey: 'endAt', title: '结束时间', width: 150, cell: (_h: any, { row }: any) => fmt(row.endAt) },
  { colKey: 'updatedAt', title: '更新时间', width: 150, cell: (_h: any, { row }: any) => fmt(row.updatedAt) },
  { colKey: 'actions', title: '操作', width: 130, fixed: 'right' as const },
]

onMounted(() => { fetchOptions(); fetchList() })
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <div>
        <h2 style="font-size: 24px; font-weight: 700; color: #18231E; margin: 0;">Banner管理</h2>
        <div style="font-size: 13px; color: #8A9288; margin-top: 6px;">用于小程序首页运营位。活动系列为未来预留能力，当前不可配置。</div>
      </div>
      <t-button theme="primary" @click="openCreate">新建Banner</t-button>
    </div>

    <div style="background: #FFFFFF; border-radius: 12px; border: 1px solid #EDE9DF; overflow-x: auto;">
      <t-table :data="list" :columns="columns" row-key="id" hover stripe size="small" :loading="loading">
        <template #imageUrl="{ row }">
          <img :src="assetUrl(row.imageUrl)" style="width: 72px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid #EDE9DF;" />
        </template>
        <template #status="{ row }">
          <t-tag :theme="row.status === 'ACTIVE' ? 'success' : 'default'" variant="light">
            {{ row.status === 'ACTIVE' ? '启用' : '停用' }}
          </t-tag>
        </template>
        <template #actions="{ row }">
          <t-space size="small">
            <t-button theme="default" variant="text" size="small" @click="openEdit(row)">编辑</t-button>
            <t-button theme="default" variant="text" size="small" style="color: #B35B4B;" @click="removeBanner(row)">删除</t-button>
          </t-space>
        </template>
      </t-table>
    </div>

    <t-drawer v-model:visible="drawerVisible" :header="formMode === 'create' ? '新建Banner' : '编辑Banner'" size="540px" :footer="false">
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div>
          <label style="color: #8A9288; font-size: 13px;">图片 *</label>
          <div style="display: flex; gap: 10px; align-items: center; margin-top: 4px;">
            <t-input v-model="form.imageUrl" placeholder="/uploads/activity/..." style="flex: 1;" />
            <label style="height: 32px; padding: 0 12px; border: 1px solid #2E7D5A; border-radius: 4px; color: #2E7D5A; display: flex; align-items: center; cursor: pointer; font-size: 13px;">
              {{ uploadLoading ? '上传中' : '上传' }}
              <input type="file" accept="image/jpeg,image/png,image/webp" style="display:none;" @change="uploadImage" />
            </label>
          </div>
          <img v-if="form.imageUrl" :src="assetUrl(form.imageUrl)" style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px; border: 1px solid #EDE9DF; margin-top: 8px;" />
        </div>
        <div><label style="color: #8A9288; font-size: 13px;">标题 *</label><t-input v-model="form.title" maxlength="100" /></div>
        <div><label style="color: #8A9288; font-size: 13px;">描述</label><t-textarea v-model="form.description" :autosize="{ minRows: 2, maxRows: 4 }" maxlength="240" /></div>
        <div style="display: flex; gap: 12px;">
          <div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">排序</label><t-input-number v-model="form.sortOrder" style="width: 100%;" /></div>
          <div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">状态</label><t-select v-model="form.status" :options="statusOptions" style="width: 100%;" /></div>
        </div>
        <div style="display: flex; gap: 12px;">
          <div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">展示开始</label><t-input v-model="form.startAt" type="datetime-local" /></div>
          <div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">展示结束</label><t-input v-model="form.endAt" type="datetime-local" /></div>
        </div>
        <div><label style="color: #8A9288; font-size: 13px;">跳转类型</label><t-select v-model="form.jumpType" :options="jumpTypeOptions" style="width: 100%;" @change="form.jumpValue = ''" /></div>
        <div v-if="form.jumpType === 'ACTIVITY'"><label style="color: #8A9288; font-size: 13px;">跳转活动</label><t-select v-model="form.jumpValue" :options="activities.map((a: any) => ({ label: a.title, value: String(a.id) }))" filterable style="width: 100%;" /></div>
        <div v-if="form.jumpType === 'CATEGORY'"><label style="color: #8A9288; font-size: 13px;">跳转主题</label><t-select v-model="form.jumpValue" :options="categories.map((c: any) => ({ label: c.name, value: String(c.id) }))" style="width: 100%;" /></div>
        <div v-if="formError" style="color: #B35B4B; font-size: 13px;">{{ formError }}</div>
        <div style="display: flex; gap: 12px; margin-top: 8px;">
          <t-button style="flex: 1;" @click="drawerVisible = false">取消</t-button>
          <t-button theme="primary" style="flex: 1;" :loading="formLoading" @click="submitForm">保存</t-button>
        </div>
      </div>
    </t-drawer>
  </div>
</template>
