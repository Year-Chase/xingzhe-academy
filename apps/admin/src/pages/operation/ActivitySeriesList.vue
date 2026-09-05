<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { get, patch, post } from '@/api/client'
import { assetUrl, API_BASE_URL } from '@/config/api'

interface ActivitySeriesItem {
  id: string
  name: string
  code: string
  coverImage: string
  shortDescription: string
  description: string
  externalUrl: string
  sortOrder: number
  status: 'ACTIVE' | 'INACTIVE'
  activityCount: number
  updatedAt: string
}

const list = ref<ActivitySeriesItem[]>([])
const loading = ref(false)
const drawerVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const formId = ref('')
const formError = ref('')
const formLoading = ref(false)
const uploadLoading = ref(false)
const form = reactive({
  name: '',
  coverImage: '',
  shortDescription: '',
  description: '',
  externalUrl: '',
  sortOrder: 0,
  status: 'ACTIVE',
})

const statusOptions = [
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'INACTIVE' },
]

const fmt = (s: string | null) => {
  if (!s) return '-'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const fetchList = async () => {
  loading.value = true
  try { list.value = await get<ActivitySeriesItem[]>('/admin/activity-series') }
  catch (e: any) { MessagePlugin.error(e?.response?.data?.message || '品牌加载失败') }
  finally { loading.value = false }
}

const resetForm = () => {
  form.name = ''
  form.coverImage = ''
  form.shortDescription = ''
  form.description = ''
  form.externalUrl = ''
  form.sortOrder = 0
  form.status = 'ACTIVE'
  formError.value = ''
}

const openCreate = () => {
  resetForm()
  formMode.value = 'create'
  formId.value = ''
  drawerVisible.value = true
}

const openEdit = (row: ActivitySeriesItem) => {
  formMode.value = 'edit'
  formId.value = row.id
  form.name = row.name
  form.coverImage = row.coverImage || ''
  form.shortDescription = row.shortDescription || ''
  form.description = row.description || ''
  form.externalUrl = row.externalUrl || ''
  form.sortOrder = Number(row.sortOrder || 0)
  form.status = row.status || 'ACTIVE'
  formError.value = ''
  drawerVisible.value = true
}

const submitForm = async () => {
  const name = form.name.trim()
  const shortDescription = form.shortDescription.trim()
  if (!name) { formError.value = '品牌名称不能为空'; return }
  if (shortDescription.length > 50) { formError.value = '品牌一句话介绍最多50字'; return }
  const externalUrl = form.externalUrl.trim()
  if (externalUrl && (!/^https:\/\//i.test(externalUrl) || externalUrl.length > 500)) { formError.value = '品牌跳转链接必须为不超过500字符的 https 地址'; return }
  formLoading.value = true
  formError.value = ''
  const body = {
    name,
    coverImage: form.coverImage.trim() || null,
    shortDescription: shortDescription || null,
    description: form.description.trim() || null,
    externalUrl: externalUrl || null,
    sortOrder: Number(form.sortOrder || 0),
    status: form.status,
  }
  try {
    if (formMode.value === 'create') await post('/admin/activity-series', body)
    else await patch('/admin/activity-series/' + formId.value, body)
    MessagePlugin.success(formMode.value === 'create' ? '品牌已创建' : '品牌已保存')
    drawerVisible.value = false
    fetchList()
  } catch (e: any) {
    formError.value = e?.response?.data?.message || e?.message || '品牌介绍保存失败，请检查内容后重试'
  } finally {
    formLoading.value = false
  }
}

const stopSeries = async (row: ActivitySeriesItem) => {
  await patch('/admin/activity-series/' + row.id, { status: 'INACTIVE' })
  MessagePlugin.success('品牌已停用')
  fetchList()
}

const enableSeries = async (row: ActivitySeriesItem) => {
  await patch('/admin/activity-series/' + row.id, { status: 'ACTIVE' })
  MessagePlugin.success('品牌已启用')
  fetchList()
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
    form.coverImage = data.url
    MessagePlugin.success('上传成功')
  } catch (err: any) {
    MessagePlugin.error(err?.message || '上传失败')
  } finally {
    uploadLoading.value = false
    ;(e.target as HTMLInputElement).value = ''
  }
}

const columns = [
  { colKey: 'coverImage', title: '封面', width: 110 },
  { colKey: 'name', title: '品牌名称', width: 140 },
  { colKey: 'code', title: '编码', width: 120 },
  { colKey: 'shortDescription', title: '一句话介绍', ellipsis: true },
  { colKey: 'externalUrl', title: '官网', width: 80 },
  { colKey: 'activityCount', title: '活动数量', width: 90 },
  { colKey: 'status', title: '状态', width: 80 },
  { colKey: 'sortOrder', title: '排序', width: 70 },
  { colKey: 'updatedAt', title: '更新时间', width: 150, cell: (_h: any, { row }: any) => fmt(row.updatedAt) },
  { colKey: 'actions', title: '操作', width: 150, fixed: 'right' as const },
]

onMounted(fetchList)
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <div>
        <h2 style="font-size: 24px; font-weight: 700; color: #18231E; margin: 0;">品牌管理</h2>
        <div style="font-size: 13px; color: #8A9288; margin-top: 6px;">用于维护长期活动品牌/IP，例如暖聚、X50；不等同于活动分类。</div>
      </div>
      <t-button theme="primary" @click="openCreate">新增品牌</t-button>
    </div>

    <div style="background: #FFFFFF; border-radius: 12px; border: 1px solid #EDE9DF; overflow-x: auto;">
      <t-table :data="list" :columns="columns" row-key="id" hover stripe size="small" :loading="loading">
        <template #coverImage="{ row }">
          <img v-if="row.coverImage" :src="assetUrl(row.coverImage)" style="width: 72px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid #EDE9DF;" />
          <span v-else style="color: #8A9288; font-size: 12px;">未配置</span>
        </template>
        <template #status="{ row }">
          <t-tag :theme="row.status === 'ACTIVE' ? 'success' : 'default'" variant="light">
            {{ row.status === 'ACTIVE' ? '启用' : '停用' }}
          </t-tag>
        </template>
        <template #externalUrl="{ row }"><span style="font-size: 12px; color: #747D77;">{{ row.externalUrl ? '已配置' : '未配置' }}</span></template>
        <template #actions="{ row }">
          <t-space size="small">
            <t-button theme="default" variant="text" size="small" @click="openEdit(row)">编辑</t-button>
            <t-button v-if="row.status === 'ACTIVE'" theme="default" variant="text" size="small" style="color: #C98255;" @click="stopSeries(row)">停用</t-button>
            <t-button v-else theme="default" variant="text" size="small" style="color: #2E7D5A;" @click="enableSeries(row)">启用</t-button>
          </t-space>
        </template>
      </t-table>
    </div>

    <t-drawer v-model:visible="drawerVisible" :header="formMode === 'create' ? '新增品牌' : '编辑品牌'" size="540px" :footer="false">
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div><label style="color: #8A9288; font-size: 13px;">品牌名称 *</label><t-input v-model="form.name" placeholder="例如：暖聚" /></div>
        <div>
          <label style="color: #8A9288; font-size: 13px;">品牌封面</label>
          <div style="display: flex; gap: 10px; align-items: center; margin-top: 4px;">
            <t-input v-model="form.coverImage" placeholder="/uploads/activity/..." style="flex: 1;" />
            <label style="height: 32px; padding: 0 12px; border: 1px solid #2E7D5A; border-radius: 4px; color: #2E7D5A; display: flex; align-items: center; cursor: pointer; font-size: 13px;">
              {{ uploadLoading ? '上传中' : '上传' }}
              <input type="file" accept="image/jpeg,image/png,image/webp" style="display:none;" @change="uploadImage" />
            </label>
          </div>
          <div style="font-size: 12px; color: #8A9288; margin-top: 6px;">建议比例：4:3；推荐尺寸：1200 × 900 px 或更高。建议主体居中，重要文字不要贴边。</div>
          <img v-if="form.coverImage" :src="assetUrl(form.coverImage)" style="width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 8px; border: 1px solid #EDE9DF; margin-top: 8px;" />
        </div>
        <div>
          <label style="color: #8A9288; font-size: 13px;">一句话介绍</label>
          <t-input v-model="form.shortDescription" maxlength="50" placeholder="用一句话告诉用户，这个品牌为什么值得参加，最多50字" />
          <div style="font-size: 12px; color: #8A9288; margin-top: 4px;">{{ form.shortDescription.length }} / 50</div>
        </div>
        <div><label style="color: #8A9288; font-size: 13px;">详细介绍</label><t-textarea v-model="form.description" :autosize="{ minRows: 4, maxRows: 8 }" /></div>
        <div>
          <label style="color: #8A9288; font-size: 13px;">品牌跳转链接</label>
          <t-input v-model="form.externalUrl" placeholder="请输入 https:// 开头的品牌官网链接" maxlength="500" />
          <div style="font-size: 12px; color: #8A9288; margin-top: 4px;">配置后将在小程序品牌详情展示“访问品牌官网”。</div>
        </div>
        <div style="display: flex; gap: 12px;">
          <div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">排序</label><t-input-number v-model="form.sortOrder" style="width: 100%;" /></div>
          <div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">状态</label><t-select v-model="form.status" :options="statusOptions" style="width: 100%;" /></div>
        </div>
        <div v-if="formError" style="color: #B35B4B; font-size: 13px;">{{ formError }}</div>
        <div style="display: flex; gap: 12px; margin-top: 8px;">
          <t-button style="flex: 1;" @click="drawerVisible = false">取消</t-button>
          <t-button theme="primary" style="flex: 1;" :loading="formLoading" @click="submitForm">保存</t-button>
        </div>
      </div>
    </t-drawer>
  </div>
</template>
