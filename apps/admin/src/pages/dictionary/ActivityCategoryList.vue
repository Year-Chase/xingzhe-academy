<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { del, get, patch, post } from '@/api/client'

interface ActivityCategoryItem {
  id: string
  name: string
  code: string
  description: string | null
  sortOrder: number
  status: 'ACTIVE' | 'INACTIVE'
  activityCount: number
  updatedAt: string
}

const list = ref<ActivityCategoryItem[]>([])
const loading = ref(false)
const drawerVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const formId = ref('')
const formError = ref('')
const formLoading = ref(false)
const form = reactive({
  name: '',
  code: '',
  description: '',
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
  try { list.value = await get<ActivityCategoryItem[]>('/admin/dictionary/activity-categories') }
  catch (e: any) { MessagePlugin.error(e?.response?.data?.message || '加载失败') }
  finally { loading.value = false }
}

const resetForm = () => {
  form.name = ''
  form.code = ''
  form.description = ''
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

const openEdit = (row: ActivityCategoryItem) => {
  formMode.value = 'edit'
  formId.value = row.id
  form.name = row.name
  form.code = row.code
  form.description = row.description || ''
  form.sortOrder = Number(row.sortOrder || 0)
  form.status = row.status || 'ACTIVE'
  formError.value = ''
  drawerVisible.value = true
}

const submitForm = async () => {
  const name = form.name.trim()
  const code = form.code.trim()
  if (!name) { formError.value = '分类名称不能为空'; return }
  if (!code) { formError.value = '分类编码不能为空'; return }
  formLoading.value = true
  formError.value = ''
  const body = {
    name,
    code,
    description: form.description.trim() || null,
    sortOrder: Number(form.sortOrder || 0),
    status: form.status,
  }
  try {
    if (formMode.value === 'create') await post('/admin/dictionary/activity-categories', body)
    else await patch('/admin/dictionary/activity-categories/' + formId.value, body)
    MessagePlugin.success(formMode.value === 'create' ? '分类已创建' : '分类已保存')
    drawerVisible.value = false
    fetchList()
  } catch (e: any) {
    formError.value = e?.response?.data?.message || e?.message || '保存失败'
  } finally {
    formLoading.value = false
  }
}

const stopCategory = async (row: ActivityCategoryItem) => {
  await patch('/admin/dictionary/activity-categories/' + row.id, { status: 'INACTIVE' })
  MessagePlugin.success('分类已停用')
  fetchList()
}

const deleteCategory = (row: ActivityCategoryItem) => {
  const dlg = DialogPlugin.confirm({
    header: '删除活动分类',
    body: '活动分类不允许物理删除；已被活动使用的分类只能停用。是否继续检查删除？',
    onConfirm: async () => {
      dlg.hide()
      try {
        await del('/admin/dictionary/activity-categories/' + row.id)
        MessagePlugin.success('分类已删除')
        fetchList()
      } catch (e: any) {
        MessagePlugin.warning(e?.response?.data?.message || '活动分类不允许物理删除，请停用')
      }
    },
  })
}

const columns = [
  { colKey: 'name', title: '名称', width: 120 },
  { colKey: 'code', title: '编码', width: 120 },
  { colKey: 'activityCount', title: '活动数量', width: 90 },
  { colKey: 'status', title: '状态', width: 80 },
  { colKey: 'sortOrder', title: '排序', width: 70 },
  { colKey: 'updatedAt', title: '更新时间', width: 150, cell: (_h: any, { row }: any) => fmt(row.updatedAt) },
  { colKey: 'description', title: '说明', ellipsis: true, cell: (_h: any, { row }: any) => row.description || '-' },
  { colKey: 'actions', title: '操作', width: 190, fixed: 'right' as const },
]

onMounted(fetchList)
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h2 style="font-size: 24px; font-weight: 700; color: #18231E; margin: 0;">活动分类</h2>
      <t-button theme="primary" @click="openCreate">新建分类</t-button>
    </div>

    <div style="background: #FFFFFF; border-radius: 12px; border: 1px solid #EDE9DF; overflow-x: auto;">
      <t-table :data="list" :columns="columns" row-key="id" hover stripe size="small" :loading="loading">
        <template #status="{ row }">
          <t-tag :theme="row.status === 'ACTIVE' ? 'success' : 'default'" variant="light">
            {{ row.status === 'ACTIVE' ? '启用' : '停用' }}
          </t-tag>
        </template>
        <template #actions="{ row }">
          <t-space size="small">
            <t-button theme="default" variant="text" size="small" @click="openEdit(row)">编辑</t-button>
            <t-button v-if="row.status === 'ACTIVE'" theme="default" variant="text" size="small" style="color: #C98255;" @click="stopCategory(row)">停用</t-button>
            <t-button theme="default" variant="text" size="small" style="color: #B35B4B;" @click="deleteCategory(row)">删除</t-button>
          </t-space>
        </template>
      </t-table>
    </div>

    <t-drawer v-model:visible="drawerVisible" :header="formMode === 'create' ? '新建活动分类' : '编辑活动分类'" size="480px" :footer="false">
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div><label style="color: #8A9288; font-size: 13px;">名称 *</label><t-input v-model="form.name" placeholder="例如：徒步" /></div>
        <div><label style="color: #8A9288; font-size: 13px;">编码 *</label><t-input v-model="form.code" :disabled="formMode === 'edit'" placeholder="例如：hiking" /></div>
        <div><label style="color: #8A9288; font-size: 13px;">说明</label><t-textarea v-model="form.description" :autosize="{ minRows: 3, maxRows: 6 }" /></div>
        <div><label style="color: #8A9288; font-size: 13px;">排序</label><t-input-number v-model="form.sortOrder" style="width: 100%;" /></div>
        <div><label style="color: #8A9288; font-size: 13px;">状态</label><t-select v-model="form.status" :options="statusOptions" style="width: 100%;" /></div>
        <div v-if="formError" style="color: #B35B4B; font-size: 13px;">{{ formError }}</div>
        <div style="display: flex; gap: 12px; margin-top: 8px;">
          <t-button style="flex: 1;" @click="drawerVisible = false">取消</t-button>
          <t-button theme="primary" style="flex: 1;" :loading="formLoading" @click="submitForm">保存</t-button>
        </div>
      </div>
    </t-drawer>
  </div>
</template>
