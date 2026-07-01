<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { get, post, patch } from '@/api/client'
import { assetUrl, API_BASE_URL } from '@/config/api'

// ── V2.5B helpers ──
const yuan = (n: number) => '¥' + (n || 0).toFixed(2)
const fmtDate = (s: string | null) => s ? new Date(s).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'
const fmtDateFull = (s: string | null) => s ? new Date(s).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'

function maskIdCard(val: string | null): string {
  if (!val) return '-'
  const m = val.match(/^(\d{3})\d+([\dXx]\d{3})$/)
  if (!m) return val.slice(0, 3) + '***'
  return m[1] + '***********' + m[2].toUpperCase()
}
function maskPhone(phone: string | null): string {
  if (!phone) return '-'
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}
function safeArray(s: string | string[] | null): string[] {
  if (Array.isArray(s)) return s
  if (!s) return []
  try { const v = JSON.parse(s); return Array.isArray(v) ? v : [] } catch { return [] }
}
function arrLabelCompat(arr: any[] | null | undefined): string {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return '未配置'
  return '已配置'
}

const FIELD_LABELS: Record<string, string> = {
  realName: '真实姓名', phone: '手机号', idCardNo: '身份证号',
  departureCity: '出发城市', transportPreference: '交通工具偏好', roomPreference: '房间偏好',
}

// ── types ──
interface ActivityItem {
  id: number; title: string; slogan: string; province?: string; description: string; location: string; city: string
  startTime: string; endTime: string; registrationStartTime: string; registrationEndTime: string
  capacity: number; registeredCount: number; status: string; coverImage: string
  price: number; memberPrice: number; lifetimeMemberPrice: number; paymentMode: string
  prepayAmount?: number; remainingAmount?: number; remainingPayDate?: string
  memoryImages?: any; memoryText?: string
  requiredUserInfoFields?: any
  groupQrType?: string; groupQrImageUrl?: string; groupQrTitle?: string; groupQrDescription?: string
  createdAt: string
}
interface PageData { items: ActivityItem[]; total: number; page: number; limit: number }
interface FormData {
  title: string; slogan: string; province: string; description: string; location: string; city: string
  startTime: string; endTime: string; registrationStartTime: string; registrationEndTime: string
  capacity: number; coverImage: string; price: number; memberPrice: number; lifetimeMemberPrice: number; paymentMode: string
  prepayAmount: number; remainingAmount: number; remainingPayDate: string
  requiredUserInfoFields: string[]
  groupQrType: string; groupQrImageUrl: string; groupQrTitle: string; groupQrDescription: string
  certificateTemplateId: number | null
  provinceCode: string; cityCode: string; provinceName: string; cityName: string
  adcode: string; lng: number | null; lat: number | null
  locationName: string; locationAddress: string; locationLat: number | null; locationLng: number | null
  coordinateType: string; locationProvider: string
}

// ── state ──
const list = ref<ActivityItem[]>([])
const total = ref(0); const page = ref(1); const limit = ref(20)
const loading = ref(false); const error = ref('')
const keyword = ref(''); const statusFilter = ref('')
const detailVisible = ref(false); const detailItem = ref<ActivityItem | null>(null)
const regInfoList = ref<any[]>([]); const regInfoLoading = ref(false)
const formDrawer = ref(false); const formMode = ref<'create' | 'edit'>('create'); const formId = ref(0)
const formLoading = ref(false); const formError = ref('')
const uploadLoading = ref(false); const coverPreview = ref(''); const qrPreview = ref('')
const origStart = ref(''); const origEnd = ref(''); const origRegStart = ref(''); const origRegEnd = ref('')
const form = reactive<FormData>({
  title: '', slogan: '', province: '', description: '', location: '', city: '',
  startTime: '', endTime: '', registrationStartTime: '', registrationEndTime: '',
  capacity: 30, coverImage: '', price: 0, memberPrice: 0, lifetimeMemberPrice: 0, paymentMode: 'FULL',
  prepayAmount: 0, remainingAmount: 0, remainingPayDate: '',
  requiredUserInfoFields: [],
  groupQrType: 'NONE', groupQrImageUrl: '', groupQrTitle: '加入活动群', groupQrDescription: '活动通知、集合安排和现场事项将在群内同步',
  certificateTemplateId: null,
  provinceCode: '', cityCode: '', provinceName: '', cityName: '',
  adcode: '', lng: null, lat: null,
  locationName: '', locationAddress: '', locationLat: null, locationLng: null,
  coordinateType: 'gcj02', locationProvider: 'manual',
})
// ── V2.5B: Memory drawer ──
const memoryDrawer = ref(false); const memoryId = ref(0); const memoryTitle = ref('')
const memoryImages = ref<any[]>([]); const memoryText = ref(''); const memoryUploadLoading = ref(false)
const memoryLoading = ref(false); const memoryError = ref('')
const certTemplates = ref<any[]>([]); const certTemplatesLoading = ref(false)

const statusOptions = [
  { label: '全部', value: '' }, { label: '未发布', value: 'DRAFT' },
  { label: '已发布', value: 'PUBLISHED' }, { label: '已下架', value: 'CLOSED' },
]
const qrTypeOptions = [
  { label: '不展示', value: 'NONE' }, { label: '微信群二维码', value: 'WECHAT_GROUP' },
  { label: '企业微信群二维码', value: 'WECOM_GROUP' }, { label: '企业微信群活码', value: 'WECOM_LIVE_CODE' },
]

const regFieldOptions = [
  { label: '真实姓名', value: 'realName' }, { label: '手机号', value: 'phone' },
  { label: '身份证号', value: 'idCardNo' }, { label: '出发城市', value: 'departureCity' },
  { label: '交通工具偏好', value: 'transportPreference' }, { label: '房间偏好', value: 'roomPreference' },
]
const statusLabel = (s: string) => ({ PUBLISHED: '已发布', DRAFT: '未发布', CLOSED: '已下架', ENDED: '已结束' } as any)[s] || s
const statusColor = (s: string) => ({ PUBLISHED: '#2E7D5A', DRAFT: '#8A9288', CLOSED: '#B35B4B', ENDED: '#8A9288' } as any)[s] || '#666'
const pmLabel = (p: string) => ({ FULL: '全款', PREPAY: '预付+后付' } as any)[p] || p
const toLocal = (s: string) => { if (!s) return ''; const d = new Date(s); const offset = d.getTimezoneOffset(); return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16) }
const toLocalDate = (s: string) => { if (!s) return ''; const d = new Date(s); const offset = d.getTimezoneOffset(); return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10) }

// ── fetch list ──
const fetchList = async () => {
  loading.value = true; error.value = ''
  try { const data = await get<PageData>('/admin/activity', { page: page.value, limit: limit.value, keyword: keyword.value || undefined, status: statusFilter.value || undefined }); list.value = data.items; total.value = data.total }
  catch (e: any) { error.value = e?.response?.data?.message || e?.message || '加载失败' }
  finally { loading.value = false }
}
const onPageChange = (p: { current: number; pageSize: number }) => { page.value = p.current; limit.value = p.pageSize; fetchList() }
const onSearch = () => { page.value = 1; fetchList() }

// ── detail ──
const openDetail = async (row: ActivityItem) => {
  detailVisible.value = true; detailItem.value = null; regInfoList.value = []
  try { detailItem.value = await get<ActivityItem>('/admin/activity/' + row.id) } catch { detailItem.value = row }
  regInfoLoading.value = true; try { regInfoList.value = await get<any[]>('/admin/activity/' + row.id + '/registrations') } catch { regInfoList.value = [] }
  finally { regInfoLoading.value = false }
}

// ── upload (reused for both cover and memory) ──
const doUpload = async (file: File): Promise<string | null> => {
  try { const fd = new FormData(); fd.append('file', file); const res = await fetch(`${API_BASE_URL}/admin/activity/upload-cover`, { method: 'POST', body: fd }); const data = await res.json(); return data.url }
  catch { MessagePlugin.error('上传失败'); return null }
}
const handleUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement)?.files?.[0]; if (!file) return
  uploadLoading.value = true; const url = await doUpload(file); if (url) { form.coverImage = url; coverPreview.value = url; MessagePlugin.success('上传成功') }
  uploadLoading.value = false
}
const handleMemoryUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement)?.files?.[0]; if (!file) return
  memoryUploadLoading.value = true; const url = await doUpload(file); if (url) { memoryImages.value.push(url); MessagePlugin.success('上传成功') }
  memoryUploadLoading.value = false
}

// ── create / edit ──
const resetForm = () => {
  form.title = ''; form.slogan = ''; form.province = ''; form.description = ''; form.location = ''; form.city = ''
  form.startTime = ''; form.endTime = ''; form.registrationStartTime = ''; form.registrationEndTime = ''
  form.capacity = 30; form.coverImage = ''; form.price = 0; form.memberPrice = 0; form.lifetimeMemberPrice = 0; form.paymentMode = 'FULL'
  form.prepayAmount = 0; form.remainingAmount = 0; form.remainingPayDate = ''
  form.requiredUserInfoFields = []
  form.groupQrType = 'NONE'; form.groupQrImageUrl = ''; form.groupQrTitle = '加入活动群'; form.groupQrDescription = '活动通知、集合安排和现场事项将在群内同步'
  form.certificateTemplateId = null
  form.provinceCode = ''; form.cityCode = ''; form.provinceName = ''; form.cityName = ''
  form.adcode = ''; form.lng = null; form.lat = null
  form.locationName = ''; form.locationAddress = ''; form.locationLat = null; form.locationLng = null
  form.coordinateType = 'gcj02'; form.locationProvider = 'manual'
  coverPreview.value = ''; qrPreview.value = ''; formError.value = ''
}
const openCreate = () => { resetForm(); formMode.value = 'create'; formId.value = 0; formDrawer.value = true }
const openEdit = (row: ActivityItem) => {
  formMode.value = 'edit'; formId.value = row.id
  form.title = row.title; form.slogan = row.slogan || ''; form.province = row.province || ''; form.description = row.description || ''; form.location = row.location || ''
  form.city = row.city || ''; form.capacity = row.capacity
  form.price = row.price ?? 0; form.memberPrice = row.memberPrice ?? 0; form.lifetimeMemberPrice = row.lifetimeMemberPrice ?? 0
  form.paymentMode = row.paymentMode || 'FULL'
  form.prepayAmount = row.prepayAmount ?? 0; form.remainingAmount = row.remainingAmount ?? 0
  form.remainingPayDate = toLocalDate(row.remainingPayDate || '') || ''
  form.requiredUserInfoFields = safeArray(row.requiredUserInfoFields || null)
  form.groupQrType = row.groupQrType || 'NONE'
  form.groupQrImageUrl = row.groupQrImageUrl || ''
  form.groupQrTitle = row.groupQrTitle || '加入活动群'
  form.groupQrDescription = row.groupQrDescription || '活动通知、集合安排和现场事项将在群内同步'
  form.certificateTemplateId = (row as any).certificateTemplateId ?? null
  form.locationName = (row as any).locationName || ''
  form.locationAddress = (row as any).locationAddress || ''
  form.locationLat = (row as any).locationLat ?? null
  form.locationLng = (row as any).locationLng ?? null
  form.coordinateType = (row as any).coordinateType || 'gcj02'
  form.locationProvider = (row as any).locationProvider || 'manual'
  form.startTime = toLocal(row.startTime); form.endTime = toLocal(row.endTime)
  form.registrationStartTime = toLocal(row.registrationStartTime); form.registrationEndTime = toLocal(row.registrationEndTime)
  form.coverImage = row.coverImage || ''; coverPreview.value = row.coverImage || ''
  qrPreview.value = row.groupQrImageUrl || ''
  origStart.value = row.startTime || ''; origEnd.value = row.endTime || ''
  origRegStart.value = row.registrationStartTime || ''; origRegEnd.value = row.registrationEndTime || ''
  formError.value = ''; formDrawer.value = true
}
const submitForm = async () => {
  if (!form.title || !form.startTime || !form.endTime || !form.registrationStartTime || !form.registrationEndTime || !form.capacity || Number(form.capacity) <= 0) { formError.value = '标题、活动开始/结束时间、报名开始/结束时间、人数（>0）为必填项'; return }
  if (!form.province?.trim() || !form.city?.trim()) { formError.value = '请填写活动省份和城市'; return }
  if (new Date(form.endTime) <= new Date(form.startTime)) { formError.value = '活动结束时间必须晚于活动开始时间'; return }
  if (new Date(form.registrationEndTime) <= new Date(form.registrationStartTime)) { formError.value = '报名结束时间必须晚于报名开始时间'; return }
  if (form.paymentMode === 'PREPAY' && (form.prepayAmount == null || form.prepayAmount === undefined || form.remainingAmount == null || form.remainingAmount === undefined)) { formError.value = '预付+后付模式下，预付金额和后付金额为必填项'; return }
  if (!form.locationName?.trim()) { formError.value = '请填写活动地点名称'; return }
  // LOCATION-GUARD-003: validate raw coordinate values first, reject 0,0
  const rawLng = String(form.locationLng ?? '').trim()
  const rawLat = String(form.locationLat ?? '').trim()
  if (!rawLng || !rawLat) { formError.value = '请填写活动地点经纬度'; return }
  const lng = Number(rawLng)
  const lat = Number(rawLat)
  if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90 || (lng === 0 && lat === 0)) { formError.value = '请填写活动地点经纬度'; return }
  formLoading.value = true; formError.value = ''
  const normalizedLocationName = String(form.locationName || '').trim()
  const normalizedLocationAddress = normalizedLocationName
  const syncLocation = normalizedLocationName
  const syncProvince = String(form.province || '').trim()
  const syncCity = String(form.city || '').trim()
  const body: any = {
    title: form.title, slogan: form.slogan || undefined, province: syncProvince || undefined,
    description: form.description, location: syncLocation, city: syncCity || undefined,
    capacity: Number(form.capacity), coverImage: form.coverImage || undefined,
    price: form.price, memberPrice: form.memberPrice, lifetimeMemberPrice: form.lifetimeMemberPrice,
    paymentMode: form.paymentMode,
    prepayAmount: form.prepayAmount, remainingAmount: form.remainingAmount,
    remainingPayDate: form.remainingPayDate || undefined,
    requiredUserInfoFields: form.requiredUserInfoFields,
    groupQrType: form.groupQrType || 'NONE',
    groupQrImageUrl: form.groupQrImageUrl,
    groupQrTitle: form.groupQrTitle,
    groupQrDescription: form.groupQrDescription,
    certificateTemplateId: form.certificateTemplateId ?? undefined,
    provinceName: syncProvince || '', provinceCode: '',
    cityName: syncCity || '', cityCode: '',
    adcode: '', lng: null, lat: null,
    locationName: normalizedLocationName, locationAddress: normalizedLocationAddress,
    locationLat: lat, locationLng: lng,
    coordinateType: form.coordinateType || 'gcj02', locationProvider: form.locationProvider || 'manual',
  }
  if (formMode.value === 'edit') {
    body.startTime = form.startTime !== toLocal(origStart.value) ? new Date(form.startTime).toISOString() : origStart.value
    body.endTime = form.endTime !== toLocal(origEnd.value) ? new Date(form.endTime).toISOString() : origEnd.value
    body.registrationStartTime = form.registrationStartTime !== toLocal(origRegStart.value) ? new Date(form.registrationStartTime).toISOString() : origRegStart.value
    body.registrationEndTime = form.registrationEndTime !== toLocal(origRegEnd.value) ? new Date(form.registrationEndTime).toISOString() : origRegEnd.value
  } else {
    body.startTime = new Date(form.startTime).toISOString(); body.endTime = new Date(form.endTime).toISOString()
    body.registrationStartTime = new Date(form.registrationStartTime).toISOString(); body.registrationEndTime = new Date(form.registrationEndTime).toISOString()
  }
  try {
    if (formMode.value === 'create') { await post('/admin/activity', body) } else { await patch('/admin/activity/' + formId.value, body) }
    MessagePlugin.success(formMode.value === 'create' ? '创建成功' : '编辑成功'); formDrawer.value = false; fetchList()
  } catch (e: any) { formError.value = e?.response?.data?.message || e?.message || '操作失败' }
  finally { formLoading.value = false }
}

// ── publish / close ──
const doPublish = (row: ActivityItem) => {
  const dlg = DialogPlugin.confirm({ header: '确认发布', body: `确认发布「${row.title}」？`, onConfirm: async () => { dlg.hide(); try { await post('/admin/activity/' + row.id + '/publish'); MessagePlugin.success('已发布'); fetchList() } catch (e: any) { MessagePlugin.error(e?.response?.data?.message || '发布失败') } } })
}
const doClose = (row: ActivityItem) => {
  const dlg = DialogPlugin.confirm({ header: '确认下架', body: `确认下架「${row.title}」？`, onConfirm: async () => { dlg.hide(); try { await post('/admin/activity/' + row.id + '/close'); MessagePlugin.success('已下架'); fetchList() } catch (e: any) { MessagePlugin.error(e?.response?.data?.message || '下架失败') } } })
}

// ── V2.5B: Memory drawer ──
const openMemory = async (row: ActivityItem) => {
  // Re-fetch full detail to get latest memoryImages/memoryText
  memoryId.value = row.id; memoryTitle.value = row.title; memoryImages.value = []; memoryText.value = ''; memoryDrawer.value = true
  memoryLoading.value = true; memoryError.value = ''
  try {
    const detail = await get<ActivityItem>('/admin/activity/' + row.id)
    memoryImages.value = safeArray(detail.memoryImages || null) as any[]
    memoryText.value = detail.memoryText || ''
  } catch { memoryError.value = '加载失败' }
  finally { memoryLoading.value = false }
}
const saveMemory = async () => {
  memoryLoading.value = true; memoryError.value = ''
  try {
    await patch('/admin/activity/' + memoryId.value, { memoryImages: JSON.stringify(memoryImages.value), memoryText: memoryText.value })
    MessagePlugin.success('活动回忆已保存'); memoryDrawer.value = false; fetchList()
  } catch (e: any) { memoryError.value = e?.response?.data?.message || '保存失败' }
  finally { memoryLoading.value = false }
}
const removeMemoryImage = (idx: number) => { memoryImages.value.splice(idx, 1) }

const columns = [
  { colKey: 'id', title: 'ID', width: 55 },
  { colKey: 'title', title: '标题', width: 130, ellipsis: true },
  { colKey: 'slogan', title: 'Slogan', width: 110, ellipsis: true, cell: (_h: any, { row }: any) => row.slogan || '-' },
  { colKey: 'province', title: '省份', width: 60, cell: (_h: any, { row }: any) => row.province || '-' },
  { colKey: 'city', title: '城市', width: 60, cell: (_h: any, { row }: any) => row.city || '-' },
  { colKey: 'registrationStartTime', title: '报名开始', width: 120, cell: (_h: any, { row }: any) => fmtDate(row.registrationStartTime) },
  { colKey: 'registrationEndTime', title: '报名截止', width: 120, cell: (_h: any, { row }: any) => fmtDate(row.registrationEndTime) },
  { colKey: 'startTime', title: '活动时间', width: 120, cell: (_h: any, { row }: any) => fmtDate(row.startTime) },
  { colKey: 'registeredCount', title: '报名/名额', width: 85, cell: (_h: any, { row }: any) => `${row.registeredCount}/${row.capacity}` },
  { colKey: 'price', title: '价格', width: 75, cell: (_h: any, { row }: any) => row.price > 0 ? yuan(row.price) : '-' },
  { colKey: 'paymentMode', title: '支付', width: 80, cell: (_h: any, { row }: any) => pmLabel(row.paymentMode || 'FULL') },
  { colKey: 'requiredUserInfoFields', title: '信息收集', width: 70, cell: (_h: any, { row }: any) => arrLabelCompat(safeArray(row.requiredUserInfoFields || null)) },
  { colKey: 'groupQrType', title: '活动群', width: 70, cell: (_h: any, { row }: any) => (row.groupQrType && row.groupQrType !== 'NONE' && row.groupQrImageUrl) ? '已配置' : '未配置' },
  { colKey: 'status', title: '状态', width: 70 },
  { colKey: 'actions', title: '操作', width: 260, fixed: 'right' as const },
]

const fetchCertTemplates = async () => {
  certTemplatesLoading.value = true
  try { certTemplates.value = await get<any[]>('/admin/certificate-templates') }
  catch (_e) { /* ignore */ }
  finally { certTemplatesLoading.value = false }
}

onMounted(() => { fetchList(); fetchCertTemplates() })
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
      <t-table :data="list" :columns="columns" row-key="id" hover stripe size="small" :loading="loading"
        :pagination="{ current: page, pageSize: limit, total, showJumper: true }" @page-change="onPageChange" table-layout="auto">
        <template #status="{ row }"><span :style="{ color: statusColor(row.status), fontSize: '13px', fontWeight: 500 }">{{ statusLabel(row.status) }}</span></template>
        <template #actions="{ row }">
          <t-space size="small">
            <t-button theme="default" variant="text" size="small" @click="openDetail(row)">详情</t-button>
            <t-button theme="default" variant="text" size="small" @click="openEdit(row)">编辑</t-button>
            <t-button theme="default" variant="text" size="small" @click="openMemory(row)">上传</t-button>
            <t-button v-if="row.status === 'DRAFT'" theme="default" variant="text" size="small" style="color: #2E7D5A;" @click="doPublish(row)">发布</t-button>
            <t-button v-if="row.status === 'PUBLISHED'" theme="default" variant="text" size="small" style="color: #B35B4B;" @click="doClose(row)">下架</t-button>
            <t-button v-if="row.status === 'CLOSED'" theme="default" variant="text" size="small" style="color: #2E7D5A;" @click="doPublish(row)">重新发布</t-button>
          </t-space>
        </template>
        <template #empty><div style="padding: 48px 0; text-align: center; color: #8A9288;">{{ error || (keyword ? '无匹配活动' : '暂无活动') }}</div></template>
      </t-table>
    </div>

    <!-- detail drawer -->
    <t-drawer v-model:visible="detailVisible" header="活动详情" size="560px" :footer="false">
      <div v-if="detailItem" style="display: flex; flex-direction: column; gap: 12px; font-size: 14px;">
        <div><label style="color: #8A9288;">活动名称</label><div style="color: #18231E; font-weight: 600; margin-top: 4px;">{{ detailItem.title }}</div></div>
        <div v-if="detailItem.slogan"><label style="color: #8A9288;">Slogan</label><div style="color: #3F6B4F; margin-top: 4px;">{{ detailItem.slogan }}</div></div>
        <div><label style="color: #8A9288;">省份/城市</label><div style="color: #333A34; margin-top: 4px;">{{ detailItem.province || '-' }} {{ detailItem.city || '-' }}</div></div>
        <div><label style="color: #8A9288;">地点</label><div style="color: #333A34; margin-top: 4px;">{{ detailItem.location || '-' }}</div></div>
        <div><label style="color: #8A9288;">描述</label><div style="color: #333A34; margin-top: 4px;">{{ detailItem.description || '-' }}</div></div>
        <div><label style="color: #8A9288;">活动时间</label><div style="color: #333A34; margin-top: 4px;">{{ fmtDateFull(detailItem.startTime) }} ~ {{ fmtDateFull(detailItem.endTime) }}</div></div>
        <div><label style="color: #8A9288;">报名时间</label><div style="color: #333A34; margin-top: 4px;">{{ fmtDateFull(detailItem.registrationStartTime) }} ~ {{ fmtDateFull(detailItem.registrationEndTime) }}</div></div>
        <div><label style="color: #8A9288;">人数</label><div style="color: #333A34; margin-top: 4px;">{{ detailItem.registeredCount }}/{{ detailItem.capacity }} 人</div></div>
        <div><label style="color: #8A9288;">价格</label><div style="color: #333A34; margin-top: 4px;">普通 {{ yuan(detailItem.price ?? 0) }} · 会员 {{ yuan(detailItem.memberPrice ?? 0) }} · 终身 {{ yuan(detailItem.lifetimeMemberPrice ?? 0) }}</div></div>
        <div><label style="color: #8A9288;">支付模式</label><div style="color: #333A34; margin-top: 4px;">{{ pmLabel(detailItem.paymentMode || 'FULL') }}<template v-if="detailItem.paymentMode === 'PREPAY'">（预付 {{ yuan(detailItem.prepayAmount ?? 0) }} / 后付 {{ yuan(detailItem.remainingAmount ?? 0) }} {{ detailItem.remainingPayDate ? '· '+detailItem.remainingPayDate : '' }}）</template></div></div>
        <div><label style="color: #8A9288;">报名信息收集</label><div style="color: #333A34; margin-top: 4px;"><template v-if="safeArray(detailItem.requiredUserInfoFields || null).length"><span v-for="(f, i) in safeArray(detailItem.requiredUserInfoFields || null)" :key="f"><span v-if="i > 0">, </span>{{ FIELD_LABELS[f] || f }}</span></template><span v-else style="color: #8A9288;">未配置</span></div></div>
        <div><label style="color: #8A9288;">活动群</label><div style="color: #333A34; margin-top: 4px;"><template v-if="detailItem.groupQrType && detailItem.groupQrType !== 'NONE'"><div>{{ detailItem.groupQrType }}</div><div v-if="detailItem.groupQrTitle" style="margin-top: 2px;">标题: {{ detailItem.groupQrTitle }}</div><div v-if="detailItem.groupQrDescription" style="font-size: 12px; color: #7A8178;">{{ detailItem.groupQrDescription }}</div><img v-if="detailItem.groupQrImageUrl" :src="detailItem.groupQrImageUrl" style="max-width: 160px; max-height: 160px; border-radius: 8px; margin-top: 4px; border: 1px solid #EDE9DF;" /></template><span v-else style="color: #8A9288;">未配置</span></div></div>
        <div><label style="color: #8A9288;">状态</label><div style="margin-top: 4px;"><span :style="{ color: statusColor(detailItem.status), fontWeight: 500 }">{{ statusLabel(detailItem.status) }}</span></div></div>
        <div v-if="regInfoList.length > 0" style="margin-top: 12px; border-top: 1px solid #EDE9DF; padding-top: 12px;">
          <label style="color: #8A9288; font-weight: 600;">报名信息 ({{ regInfoList.length }}条)</label>
          <div v-for="(r, i) in regInfoList" :key="i" style="background: #F7F6F2; border-radius: 8px; padding: 10px; margin-top: 8px; font-size: 13px;">
            <div v-if="r.realName">真实姓名: {{ r.realName }}</div><div v-if="r.phone">手机号: {{ maskPhone(r.phone) }}</div>
            <div v-if="r.idCardNo">身份证号: {{ maskIdCard(r.idCardNo) }}</div><div v-if="r.departureCity">出发城市: {{ r.departureCity }}</div>
            <div v-if="r.transportPreference">交通工具: {{ r.transportPreference }}</div><div v-if="r.roomPreference">房间偏好: {{ r.roomPreference }}</div>
            <div v-if="r.confirmedAt" style="color: #A6AAA2; font-size: 12px; margin-top: 4px;">确认时间: {{ fmtDateFull(r.confirmedAt) }}</div>
          </div>
        </div>
        <div v-else-if="!regInfoLoading" style="margin-top: 8px; color: #8A9288; font-size: 13px;">暂无报名信息</div>
      </div>
      <div v-else style="text-align: center; color: #8A9288; padding: 32px 0;">加载中...</div>
    </t-drawer>

    <!-- create / edit drawer (NO memory fields — those are in separate memory drawer) -->
    <t-drawer v-model:visible="formDrawer" :header="formMode === 'create' ? '新建活动' : '编辑活动'" size="700px" :footer="false">
      <div style="display: flex; flex-direction: column; gap: 16px; padding-bottom: 16px;">
        <div style="font-size: 14px; font-weight: 600; color: #18231E; border-bottom: 1px solid #EDE9DF; padding-bottom: 8px;">基础信息</div>
        <div><label style="color: #8A9288; font-size: 13px;">活动标题 *</label><t-input v-model="form.title" placeholder="例如：晨跑打卡" /></div>
        <div><label style="color: #8A9288; font-size: 13px;">Slogan</label><t-input v-model="form.slogan" placeholder="少于100字" maxlength="100" /></div>
        <div style="display: flex; gap: 12px;"><div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">省份</label><t-input v-model="form.province" placeholder="手动填写，如 重庆市 / 四川省" /></div><div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">城市</label><t-input v-model="form.city" placeholder="手动填写，如 重庆 / 成都" /></div></div>
        <div style="font-size: 14px; font-weight: 600; color: #18231E; border-bottom: 1px solid #EDE9DF; padding-bottom: 8px; margin-top: 12px;">活动地点与坐标</div>
        <div><label style="color: #8A9288; font-size: 13px;">地点名称 *</label><t-input v-model="form.locationName" placeholder="例如：奥林匹克森林公园南门" /></div>
        <div style="display: flex; gap: 12px;"><div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">经度 longitude *</label><t-input v-model="form.locationLng" placeholder="106.58" type="text" /></div><div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">纬度 latitude *</label><t-input v-model="form.locationLat" placeholder="29.56" type="text" /></div></div>
        <span style="font-size: 11px; color: #8A9288; display: block; margin-top: 4px;">高德/腾讯坐标通常为：经度,纬度。例如高德返回 106.58,29.56 时：经度 longitude 填 106.58，纬度 latitude 填 29.56。请勿填写反。不使用百度地图坐标，会产生偏移。</span>
        <div><label style="color: #8A9288; font-size: 13px;">活动描述</label><t-textarea v-model="form.description" placeholder="活动详细描述" :autosize="{ minRows: 2, maxRows: 4 }" /></div>
        <div><label style="color: #8A9288; font-size: 13px;">封面图</label>
          <div style="display: flex; align-items: center; gap: 12px; margin-top: 4px;"><input type="file" accept="image/jpeg,image/png,image/webp" @change="handleUpload" style="font-size: 13px;" /></div>
          <div v-if="coverPreview" style="margin-top: 8px;"><img :src="assetUrl(coverPreview)" style="max-width: 200px; max-height: 120px; border-radius: 8px; border: 1px solid #EDE9DF;" /></div>
        </div>
        <div style="font-size: 14px; font-weight: 600; color: #18231E; border-bottom: 1px solid #EDE9DF; padding-bottom: 8px; margin-top: 8px;">时间与名额</div>
        <div style="display: flex; gap: 12px;"><div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">活动开始时间 *</label><t-input v-model="form.startTime" type="datetime-local" /></div><div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">活动结束时间 *</label><t-input v-model="form.endTime" type="datetime-local" /></div></div>
        <div style="display: flex; gap: 12px;"><div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">报名开始时间 *</label><t-input v-model="form.registrationStartTime" type="datetime-local" /></div><div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">报名结束时间 *</label><t-input v-model="form.registrationEndTime" type="datetime-local" /></div></div>
        <div><label style="color: #8A9288; font-size: 13px;">人数上限 *</label><t-input-number v-model="form.capacity" :min="1" style="width: 100%;" /></div>
        <div style="font-size: 14px; font-weight: 600; color: #18231E; border-bottom: 1px solid #EDE9DF; padding-bottom: 8px; margin-top: 8px;">价格与支付</div>
        <div style="display: flex; gap: 12px;"><div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">普通价格 ¥</label><t-input-number v-model="form.price" :min="0" style="width: 100%;" /></div><div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">会员价格 ¥</label><t-input-number v-model="form.memberPrice" :min="0" style="width: 100%;" /></div><div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">终身会员 ¥</label><t-input-number v-model="form.lifetimeMemberPrice" :min="0" style="width: 100%;" /></div></div>
        <div><label style="color: #8A9288; font-size: 13px;">支付模式</label><t-select v-model="form.paymentMode" :options="[{ label: '全款', value: 'FULL' }, { label: '预付+后付', value: 'PREPAY' }]" style="width: 100%;" /></div>
        <template v-if="form.paymentMode === 'PREPAY'"><div style="display: flex; gap: 12px;"><div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">预付金额 ¥ *</label><t-input-number v-model="form.prepayAmount" :min="0" style="width: 100%;" /></div><div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">后付金额 ¥ *</label><t-input-number v-model="form.remainingAmount" :min="0" style="width: 100%;" /></div></div><div><label style="color: #8A9288; font-size: 13px;">后付日期</label><t-input v-model="form.remainingPayDate" type="date" /></div></template>
        <div style="font-size: 14px; font-weight: 600; color: #18231E; border-bottom: 1px solid #EDE9DF; padding-bottom: 8px; margin-top: 8px;">报名信息收集</div>
        <div style="font-size: 12px; color: #7A8178;">该配置用于活动报名时补充必要组织信息。不勾选时，报名流程不增加信息收集步骤。</div>
        <t-checkbox-group v-model="form.requiredUserInfoFields" :options="regFieldOptions" />
        <div v-if="form.requiredUserInfoFields.includes('idCardNo')" style="font-size: 12px; color: #C98255; margin-top: 2px;">身份证号属于敏感信息，仅在保险、住宿、实名核验等确有必要时使用。</div>
        <div style="font-size: 14px; font-weight: 600; color: #18231E; border-bottom: 1px solid #EDE9DF; padding-bottom: 8px; margin-top: 8px;">活动群二维码</div>
        <div><label style="color: #8A9288; font-size: 13px;">群类型</label><t-select v-model="form.groupQrType" :options="qrTypeOptions" style="width: 100%;" /></div>
        <template v-if="form.groupQrType !== 'NONE'"><div><label style="color: #8A9288; font-size: 13px;">二维码图片 URL</label><t-input v-model="form.groupQrImageUrl" placeholder="https://..." /></div>
          <div v-if="form.groupQrImageUrl" style="margin-top: 4px;"><img :src="form.groupQrImageUrl" style="max-width: 160px; max-height: 160px; border-radius: 8px; border: 1px solid #EDE9DF;" /></div>
          <div><label style="color: #8A9288; font-size: 13px;">入群标题</label><t-input v-model="form.groupQrTitle" placeholder="加入活动群" /></div>
          <div><label style="color: #8A9288; font-size: 13px;">入群说明</label><t-input v-model="form.groupQrDescription" placeholder="活动通知、集合安排和现场事项将在群内同步" /></div></template>

        <div style="font-size: 14px; font-weight: 600; color: #18231E; border-bottom: 1px solid #EDE9DF; padding-bottom: 8px; margin-top: 8px;">证书模板</div>
        <div><t-select v-model="form.certificateTemplateId" :options="[{ label: '默认模板', value: null }, ...certTemplates.filter((t: any) => t.enabled).map((t: any) => ({ label: t.name, value: t.id }))]" placeholder="选择证书模板" clearable style="width: 100%;" /></div>

        <div v-if="formError" style="color: #B35B4B; font-size: 13px; margin-top: 4px;">{{ formError }}</div>
        <div style="display: flex; gap: 12px; margin-top: 8px;"><t-button @click="formDrawer = false" style="flex: 1; height: 40px;">取消</t-button><t-button @click="submitForm" :loading="formLoading" style="flex: 1; height: 40px; background: #2E7D5A; border-color: #2E7D5A; color: #fff;">{{ formMode === 'create' ? '创建' : '保存' }}</t-button></div>
      </div>
    </t-drawer>

    <!-- V2.5B: Memory drawer -->
    <t-drawer v-model:visible="memoryDrawer" :header="'活动回忆 — ' + memoryTitle" size="520px" :footer="false">
      <div style="display: flex; flex-direction: column; gap: 14px; font-size: 14px;">
        <div style="font-size: 12px; color: #C98255;">活动回忆建议在活动结束后维护，将用于小程序活动回顾和后续证书展示。</div>
        <div><label style="color: #8A9288; font-size: 13px;">回忆照片</label>
          <div style="margin-top: 4px; display: flex; flex-wrap: wrap; gap: 8px;">
            <div v-for="(img, idx) in memoryImages" :key="idx" style="position: relative; width: 100px; height: 100px; border-radius: 8px; overflow: hidden; border: 1px solid #EDE9DF;">
              <img :src="img" style="width: 100%; height: 100%; object-fit: cover;" />
              <div @click="removeMemoryImage(idx)" style="position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; background: rgba(0,0,0,0.6); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #fff; font-size: 12px;">×</div>
            </div>
            <div style="width: 100px; height: 100px; border: 1px dashed #EDE9DF; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #8A9288; font-size: 12px; cursor: pointer;">
              <input type="file" accept="image/jpeg,image/png,image/webp" @change="handleMemoryUpload" style="width: 100%; height: 100%; opacity: 0; position: absolute; cursor: pointer;" />
              <span>+ 上传</span>
            </div>
          </div>
        </div>
        <div><label style="color: #8A9288; font-size: 13px;">回忆录</label><t-textarea v-model="memoryText" placeholder="活动回忆录正文" :autosize="{ minRows: 3, maxRows: 8 }" /></div>
        <div v-if="memoryError" style="color: #B35B4B; font-size: 13px;">{{ memoryError }}</div>
        <div style="display: flex; gap: 12px; margin-top: 8px;"><t-button @click="memoryDrawer = false" style="flex: 1; height: 40px;">取消</t-button><t-button @click="saveMemory" :loading="memoryLoading" style="flex: 1; height: 40px; background: #2E7D5A; border-color: #2E7D5A; color: #fff;">保存</t-button></div>
      </div>
    </t-drawer>
  </div>
</template>
