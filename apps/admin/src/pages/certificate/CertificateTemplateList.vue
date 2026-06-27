<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { get, post, patch } from '@/api/client'

interface CertTemplate {
  id: number; name: string; description: string; imageUrl: string
  isDefault: boolean; enabled: boolean; fieldConfig: any; updatedAt: string
}

const list = ref<CertTemplate[]>([]); const loading = ref(false)
const formDrawer = ref(false); const formMode = ref<'create' | 'edit'>('create'); const formLoading = ref(false)
const formId = ref(0); const formError = ref('')
const uploadLoading = ref(false)

const FIELD_KEYS = ['recipientName', 'activityName', 'activityDate', 'issuerName', 'certificateNo', 'issuedAt', 'location', 'certificateText']
const FIELD_LABELS: Record<string, string> = {
  recipientName: '姓名', activityName: '活动名称', activityDate: '活动日期',
  issuerName: '颁发方', certificateNo: '证书编号', issuedAt: '颁发日期',
  location: '地点', certificateText: '证书短文案',
}

const form = reactive({
  name: '', description: '', imageUrl: '', isDefault: false, enabled: true,
  fieldConfig: {} as Record<string, boolean>,
})

const resetForm = () => {
  form.name = ''; form.description = ''; form.imageUrl = ''; form.isDefault = false; form.enabled = true
  form.fieldConfig = {}; formError.value = ''
}

const fetchList = async () => {
  loading.value = true
  try {
    const raw: any = await get('/admin/certificate-templates')
    // Normalize response: NestJS returns array directly, but axios interceptor or
    // response wrapper may nest it under .data or .data.data
    const rows = Array.isArray(raw) ? raw
      : Array.isArray(raw?.data) ? raw.data
      : Array.isArray(raw?.data?.data) ? raw.data.data
      : []
    list.value = rows
    if (rows.length === 0) console.warn('[certificate-template] empty list response', raw)
  } catch (e: any) {
    console.error('[certificate-template] fetchList failed', e)
    MessagePlugin.error(e?.response?.data?.message || e?.message || '加载失败')
  } finally { loading.value = false }
}

const openCreate = () => { resetForm(); formMode.value = 'create'; formId.value = 0; formDrawer.value = true }
const openEdit = (row: CertTemplate) => {
  formMode.value = 'edit'; formId.value = row.id
  form.name = row.name; form.description = row.description || ''; form.imageUrl = row.imageUrl
  form.isDefault = row.isDefault; form.enabled = row.enabled
  form.fieldConfig = parseFieldConfig(row.fieldConfig)
  formError.value = ''; formDrawer.value = true
}

const handleUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement)?.files?.[0]; if (!file) return
  uploadLoading.value = true
  try {
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch('/api/admin/certificate-templates/upload', { method: 'POST', body: fd })
    const data = await res.json()
    form.imageUrl = data.url || data?.data?.url || data?.imageUrl || ''
    if (!form.imageUrl) { MessagePlugin.error('证书底图上传失败'); return }
    MessagePlugin.success('上传成功')
  } catch (e) { console.error('cert-template upload', e); MessagePlugin.error('上传失败') }
  finally { uploadLoading.value = false }
}

const submitForm = async () => {
  if (!form.name || !form.imageUrl) { formError.value = '模板名称和证书底图为必填项'; return }
  formLoading.value = true; formError.value = ''
  const body: any = {
    name: form.name, description: form.description, imageUrl: form.imageUrl,
    isDefault: form.isDefault, enabled: form.enabled,
    fieldConfig: Object.fromEntries(FIELD_KEYS.map(k => [k, { enabled: !!form.fieldConfig[k], label: FIELD_LABELS[k] || k }])),
  }
  try {
    if (formMode.value === 'create') { await post('/admin/certificate-templates', body) }
    else { await patch('/admin/certificate-templates/' + formId.value, body) }
    MessagePlugin.success(formMode.value === 'create' ? '创建成功' : '保存成功')
    formDrawer.value = false; fetchList()
  } catch (e: any) { formError.value = e?.response?.data?.message || '操作失败' }
  finally { formLoading.value = false }
}

const doSetDefault = async (row: CertTemplate) => {
  try { await post('/admin/certificate-templates/' + row.id + '/default'); MessagePlugin.success('已设为默认'); fetchList() }
  catch (e: any) { MessagePlugin.error('设置失败') }
}
const doDisable = async (row: CertTemplate) => {
  const dlg = DialogPlugin.confirm({
    header: '确认禁用', body: `确认禁用「${row.name}」？`,
    onConfirm: async () => { dlg.hide(); try { await patch('/admin/certificate-templates/' + row.id + '/disable'); MessagePlugin.success('已禁用'); fetchList() } catch (e: any) { MessagePlugin.error('操作失败') } },
  })
}

function imgUrl(url?: string): string {
  if (!url) return ''
  if (/^https?:\/\//.test(url)) return url
  if (url.startsWith('/uploads/')) return 'http://localhost:3000' + url
  return url
}

function parseFieldConfig(raw: any): Record<string, boolean> {
  if (!raw) return {}
  // Back-end stores as JSON string; parse if needed
  let obj = raw
  if (typeof raw === 'string') {
    try { obj = JSON.parse(raw) } catch { return {} }
  }
  // fieldConfig values may be {enabled:true,label:"..."} objects
  const result: Record<string, boolean> = {}
  for (const k of FIELD_KEYS) {
    const v = obj?.[k]
    result[k] = typeof v === 'object' ? !!v?.enabled : !!v
  }
  return result
}

const fmtDate = (s: string) => s ? new Date(s).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'

const columns = [
  { colKey: 'name', title: '模板名称', width: 160 },
  { colKey: 'preview', title: '底图', width: 100 },
  { colKey: 'isDefault', title: '默认', width: 70, cell: (_h: any, { row }: any) => row.isDefault ? '✅' : '-' },
  { colKey: 'enabled', title: '状态', width: 70, cell: (_h: any, { row }: any) => row.enabled ? '已启用' : '已禁用' },
  { colKey: 'updatedAt', title: '更新时间', width: 150, cell: (_h: any, { row }: any) => fmtDate(row.updatedAt) },
  { colKey: 'actions', title: '操作', width: 260, fixed: 'right' as const },
]

onMounted(fetchList)
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h2 style="font-size: 24px; font-weight: 700; color: #18231E; margin: 0;">证书模板管理</h2>
      <t-button @click="openCreate" style="background: #2E7D5A; border-color: #2E7D5A; color: #fff;">+ 新增模板</t-button>
    </div>

    <div style="background: #FFFFFF; border-radius: 12px; border: 1px solid #EDE9DF; overflow-x: auto; padding: 16px;">
      <t-table :data="list" :columns="columns" row-key="id" hover stripe size="small" :loading="loading">
        <template #preview="{ row }">
          <img v-if="row.imageUrl" :src="imgUrl(row.imageUrl)" style="width:48px;height:64px;object-fit:cover;border-radius:4px;border:1px solid #EDE9DF;" />
          <span v-else style="color:#8A9288;font-size:12px;">-</span>
        </template>
        <template #actions="{ row }">
          <t-space size="small">
            <t-button theme="default" variant="text" size="small" @click="openEdit(row)">编辑</t-button>
            <t-button v-if="!row.isDefault && row.enabled" theme="default" variant="text" size="small" style="color: #2E7D5A;" @click="doSetDefault(row)">设为默认</t-button>
            <t-button v-if="row.enabled" theme="default" variant="text" size="small" style="color: #B35B4B;" @click="doDisable(row)">禁用</t-button>
          </t-space>
        </template>
      </t-table>
    </div>

    <t-drawer v-model:visible="formDrawer" :header="formMode === 'create' ? '新增证书模板' : '编辑证书模板'" size="580px" :footer="false">
      <div style="display: flex; flex-direction: column; gap: 14px; padding-bottom: 16px;">
        <div><label style="color: #8A9288; font-size: 13px;">模板名称 *</label><t-input v-model="form.name" placeholder="例如：山野徒步证书模板" /></div>
        <div><label style="color: #8A9288; font-size: 13px;">模板说明</label><t-input v-model="form.description" placeholder="可选" /></div>
        <div><label style="color: #8A9288; font-size: 13px;">证书底图 *</label>
          <div style="display: flex; align-items: center; gap: 12px; margin-top: 4px;">
            <input type="file" accept="image/jpeg,image/png,image/webp" @change="handleUpload" style="font-size: 13px;" />
          </div>
          <div v-if="form.imageUrl" style="margin-top: 8px;">
            <img :src="imgUrl(form.imageUrl)" style="max-width: 200px; max-height: 266px; border-radius: 8px; border: 1px solid #EDE9DF;" />
          </div>
          <span style="font-size: 11px; color: #8A9288; display: block; margin-top: 4px;">建议上传 3:4 竖版证书底图，例如 900x1200。请在图片中部 30%-75% 区域预留文字空间。</span>
        </div>

        <div style="font-size: 14px; font-weight: 600; color: #18231E; border-bottom: 1px solid #EDE9DF; padding-bottom: 8px; margin-top: 8px;">显示字段</div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
          <t-checkbox v-for="k in FIELD_KEYS" :key="k" :checked="!!form.fieldConfig[k]" @change="(val: boolean) => form.fieldConfig[k] = val">
            {{ FIELD_LABELS[k] || k }}
          </t-checkbox>
        </div>

        <div style="display: flex; gap: 12px;">
          <t-checkbox :checked="form.isDefault" @change="(val: boolean) => form.isDefault = val">设为默认模板</t-checkbox>
          <t-checkbox :checked="form.enabled" @change="(val: boolean) => form.enabled = val">启用</t-checkbox>
        </div>

        <div v-if="formError" style="color: #B35B4B; font-size: 13px;">{{ formError }}</div>
        <div style="display: flex; gap: 12px;">
          <t-button @click="formDrawer = false" style="flex: 1; height: 40px;">取消</t-button>
          <t-button @click="submitForm" :loading="formLoading" style="flex: 1; height: 40px; background: #2E7D5A; border-color: #2E7D5A; color: #fff;">{{ formMode === 'create' ? '创建' : '保存' }}</t-button>
        </div>
      </div>
    </t-drawer>
  </div>
</template>
