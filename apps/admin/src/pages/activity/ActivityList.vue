<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { get, post, patch } from '@/api/client'
import { assetUrl, API_BASE_URL } from '@/config/api'

// ── V2.5B helpers ──
const yuan = (n: number) => '¥' + (n || 0).toFixed(2)
const fmtDate = (s: string | null) => s ? new Date(s).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'
const fmtDateFull = (s: string | null) => s ? new Date(s).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'
const normalizeDateOnly = (value: any): string => {
  if (!value) return ''
  const raw = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ''
  const beijing = new Date(d.getTime() + 8 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${beijing.getUTCFullYear()}-${pad(beijing.getUTCMonth() + 1)}-${pad(beijing.getUTCDate())}`
}

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

// V2.8-C: Must match Admin CRM UserDetail.vue TYPE_OPTIONS
const TYPE_OPTIONS = ['普通用户', '会员', '终身会员', '志愿者', '工作人员']

function defaultPricingRule() {
  return TYPE_OPTIONS.map(t => ({ userType: t, label: t, fullAmount: 0, prepayAmount: 0, postpayAmount: 0, enabled: true }))
}

function initPricingRules(row?: any): any[] {
  // If activity has valid pricingRules, use them
  const existing = safeArray(row?.pricingRules || null) as any[]
  if (existing.length > 0) return existing
  // Legacy fallback: construct from old fields
  const price = row?.price ?? 0
  const memberPrice = row?.memberPrice ?? 0
  const lifetimeMemberPrice = row?.lifetimeMemberPrice ?? 0
  const prepayAmount = row?.prepayAmount ?? 0
  const remainingAmount = row?.remainingAmount ?? 0
  return TYPE_OPTIONS.map(t => {
    let full = price
    if (t === '会员') full = memberPrice > 0 ? memberPrice : price
    else if (t === '终身会员') full = lifetimeMemberPrice > 0 ? lifetimeMemberPrice : (memberPrice > 0 ? memberPrice : price)
    else if (t === '志愿者' || t === '工作人员') full = 0
    // PREPAY: only 普通用户 gets legacy prepay/postpay; others get computed values
    let pp = 0, ppost = 0
    if (t === '普通用户') { pp = prepayAmount; ppost = remainingAmount }
    else if (prepayAmount > 0) { pp = prepayAmount; ppost = Math.max(full - prepayAmount, 0) }
    return { userType: t, label: t, fullAmount: full, prepayAmount: pp, postpayAmount: ppost, enabled: full > 0 || pp > 0 }
  })
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
  imageUrls: string[]; contentBlocks: { type: string; text?: string; url?: string }[]
  pricingRules: any[]; postpayDate: string
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
const uploadLoading = ref(false); const blockUploadingIdx = ref(-1); const coverPreview = ref(''); const qrPreview = ref('')
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
  imageUrls: [] as string[], contentBlocks: [] as { type: string; text?: string; url?: string }[],
  pricingRules: defaultPricingRule(), postpayDate: '',
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

// ── upload (reused for cover, imageUrls, memory, contentBlocks) ──
const doUpload = async (file: File): Promise<string | null> => {
  try {
    const fd = new FormData(); fd.append('file', file)
    const token = localStorage.getItem('admin_token')
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${API_BASE_URL}/admin/activity/upload-cover`, { method: 'POST', headers, body: fd })
    if (res.status === 401) { MessagePlugin.error('上传失败：登录已过期，请重新登录'); return null }
    const data = await res.json()
    if (!data || !data.url) { MessagePlugin.error('上传失败：未获取到图片地址'); return null }
    return data.url
  }
  catch { MessagePlugin.error('上传失败'); return null }
}
const handleUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement)?.files?.[0]; if (!file) return
  uploadLoading.value = true; const url = await doUpload(file); if (url) { form.coverImage = url; coverPreview.value = url; if (form.imageUrls.length === 0) form.imageUrls.push(url); MessagePlugin.success('上传成功') }
  uploadLoading.value = false; (e.target as HTMLInputElement).value = ''
}
// V2.8-C: unified image upload for multi-image area
const handleImageUrlUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement)?.files?.[0]; if (!file) { (e.target as HTMLInputElement).value = ''; return }
  uploadLoading.value = true; const url = await doUpload(file)
  if (url) { form.imageUrls.push(url); if (form.imageUrls.length === 1) { form.coverImage = url; coverPreview.value = url } MessagePlugin.success('上传成功') } else { MessagePlugin.error('上传失败') }
  uploadLoading.value = false; (e.target as HTMLInputElement).value = ''
}
const removeImageUrl = (idx: number) => {
  form.imageUrls.splice(idx, 1)
  if (idx === 0 && form.imageUrls.length > 0) { form.coverImage = form.imageUrls[0]; coverPreview.value = form.imageUrls[0] }
  else if (form.imageUrls.length === 0) { form.coverImage = ''; coverPreview.value = '' }
}
// V2.8-C: contentBlocks image upload
const handleBlockImageUpload = async (e: Event, idx: number, block: any) => {
  const file = (e.target as HTMLInputElement)?.files?.[0]; if (!file) { (e.target as HTMLInputElement).value = ''; return }
  blockUploadingIdx.value = idx; const url = await doUpload(file)
  if (url) { block.url = url; MessagePlugin.success('上传成功') } else { MessagePlugin.error('上传失败') }
  blockUploadingIdx.value = -1; (e.target as HTMLInputElement).value = ''
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
  form.imageUrls = []; form.contentBlocks = []; form.pricingRules = defaultPricingRule(); form.postpayDate = ''
  coverPreview.value = ''; qrPreview.value = ''; formError.value = ''
}
const openCreate = () => { resetForm(); formMode.value = 'create'; formId.value = 0; formDrawer.value = true }
const openEdit = async (row: ActivityItem) => {
  // V2.8-C Fix-4: fetch full detail to ensure imageUrls/contentBlocks/pricingRules
  let detail = row as any
  try {
    const full = await get<any>('/admin/activity/' + row.id)
    if (full && typeof full === 'object') detail = full
  } catch (_e) { /* fallback to list row */ }
  formMode.value = 'edit'; formId.value = row.id
  form.title = detail.title; form.slogan = detail.slogan || ''; form.province = detail.province || ''; form.description = detail.description || ''; form.location = detail.location || ''
  form.city = detail.city || ''; form.capacity = detail.capacity
  form.price = detail.price ?? 0; form.memberPrice = detail.memberPrice ?? 0; form.lifetimeMemberPrice = detail.lifetimeMemberPrice ?? 0
  form.paymentMode = detail.paymentMode || 'FULL'
  form.prepayAmount = detail.prepayAmount ?? 0; form.remainingAmount = detail.remainingAmount ?? 0
  form.remainingPayDate = toLocalDate(detail.remainingPayDate || '') || ''
  form.requiredUserInfoFields = safeArray(detail.requiredUserInfoFields || null)
  form.groupQrType = detail.groupQrType || 'NONE'
  form.groupQrImageUrl = detail.groupQrImageUrl || ''
  form.groupQrTitle = detail.groupQrTitle || '加入活动群'
  form.groupQrDescription = detail.groupQrDescription || '活动通知、集合安排和现场事项将在群内同步'
  form.certificateTemplateId = (detail as any).certificateTemplateId ?? null
  form.imageUrls = safeArray((detail as any).imageUrls || null) as string[]
  form.contentBlocks = (() => {
    const blocks = safeArray((detail as any).contentBlocks || null) as any[]
    if (blocks.length > 0) return blocks
    if (detail.description) return [{ type: 'text', text: detail.description }]
    return []
  })()
  form.pricingRules = initPricingRules(detail)
  form.postpayDate = (detail as any).postpayDate || ''
  form.locationName = (detail as any).locationName || ''
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
  if (form.paymentMode === 'PREPAY') {
    const normalRule = form.pricingRules.find((r: any) => r.userType === '普通用户')
    if (!normalRule || Number(normalRule.prepayAmount || 0) <= 0) { formError.value = '普通用户预付金额必须大于 0'; return }
    if (!form.postpayDate) { formError.value = '请填写后付款日期'; return }
  }
  if (!form.locationName?.trim()) { formError.value = '请填写活动地点名称'; return }
  // LOCATION-GUARD-003: validate raw coordinate values first, reject 0,0
  const rawLng = String(form.locationLng ?? '').trim()
  const rawLat = String(form.locationLat ?? '').trim()
  if (!rawLng || !rawLat) { formError.value = '请填写活动地点经纬度'; return }
  const lng = Number(rawLng)
  const lat = Number(rawLat)
  if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90 || (lng === 0 && lat === 0)) { formError.value = '请填写活动地点经纬度'; return }
  formLoading.value = true; formError.value = ''
  // V2.8-C Fix-5: Explicitly sync coverImage from imageUrls before submit
  if (form.imageUrls.length > 0 && (!form.coverImage || form.coverImage !== form.imageUrls[0])) {
    form.coverImage = form.imageUrls[0]
  }
  const normalizedLocationName = String(form.locationName || '').trim()
  const normalizedLocationAddress = normalizedLocationName
  const syncLocation = normalizedLocationName
  const syncProvince = String(form.province || '').trim()
  const syncCity = String(form.city || '').trim()
  // V2.8-C: Sync old price fields from pricing matrix for backward compat
  const normalRule = form.pricingRules.find((r: any) => r.userType === '普通用户') || {}
  const memberRule = form.pricingRules.find((r: any) => r.userType === '会员') || {}
  const lifetimeRule = form.pricingRules.find((r: any) => r.userType === '终身会员') || {}
  const body: any = {
    title: form.title, slogan: form.slogan || undefined, province: syncProvince || undefined,
    description: form.description, location: syncLocation, city: syncCity || undefined,
    capacity: Number(form.capacity), coverImage: form.coverImage || undefined,
    price: Number(normalRule.fullAmount || 0), memberPrice: Number(memberRule.fullAmount || 0), lifetimeMemberPrice: Number(lifetimeRule.fullAmount || 0),
    paymentMode: form.paymentMode,
    prepayAmount: Number(normalRule.prepayAmount || 0), remainingAmount: Number(normalRule.postpayAmount || 0),
    remainingPayDate: normalizeDateOnly(form.postpayDate || form.remainingPayDate) || undefined,
    requiredUserInfoFields: form.requiredUserInfoFields,
    groupQrType: form.groupQrType || 'NONE',
    groupQrImageUrl: form.groupQrImageUrl,
    groupQrTitle: form.groupQrTitle,
    groupQrDescription: form.groupQrDescription,
    certificateTemplateId: form.certificateTemplateId ?? undefined,
    provinceName: syncProvince || '', provinceCode: '',
    cityName: syncCity || '', cityCode: '',
    adcode: '', lng: null, lat: null,
    imageUrls: JSON.stringify(form.imageUrls || []),
    contentBlocks: JSON.stringify(form.contentBlocks || []),
    pricingRules: JSON.stringify(form.pricingRules || []),
    postpayDate: normalizeDateOnly(form.postpayDate) || undefined,
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
        <div><label style="color: #8A9288;">活动图片</label>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
            <template v-if="(safeArray((detailItem as any).imageUrls || null) as string[]).length > 0">
              <img v-for="(img, idx) in (safeArray((detailItem as any).imageUrls || null) as string[])" :key="idx"
                :src="assetUrl(img)" style="width:60px;height:48px;object-fit:cover;border-radius:6px;border:1px solid #EDE9DF;" />
            </template>
            <template v-else-if="detailItem.coverImage">
              <img :src="assetUrl(detailItem.coverImage)" style="width:60px;height:48px;object-fit:cover;border-radius:6px;border:1px solid #EDE9DF;" />
            </template>
            <span v-else style="color: #8A9288; font-size: 12px;">-</span>
          </div>
        </div>
        <div><label style="color: #8A9288;">价格</label>
          <div v-if="(safeArray((detailItem as any).pricingRules || null) as any[]).length > 0" style="margin-top: 4px;">
            <div v-for="(rule, idx) in (safeArray((detailItem as any).pricingRules || null) as any[])" :key="idx"
              style="display: flex; gap: 12px; font-size: 12px; color: #333A34; padding: 2px 0;">
              <span style="width: 60px;">{{ rule.label }}</span>
              <span v-if="(detailItem.paymentMode || 'FULL') === 'FULL'">全款 {{ yuan(rule.fullAmount || 0) }}</span>
              <span v-else>预付 {{ yuan(rule.prepayAmount || 0) }} + 后付 {{ yuan(rule.postpayAmount || 0) }} = {{ yuan((rule.prepayAmount||0)+(rule.postpayAmount||0)) }}</span>
              <span>{{ rule.enabled === false ? '❌' : '✅' }}</span>
            </div>
          </div>
          <div v-else style="color: #333A34; margin-top: 4px;">普通 {{ yuan(detailItem.price ?? 0) }} · 会员 {{ yuan(detailItem.memberPrice ?? 0) }} · 终身 {{ yuan(detailItem.lifetimeMemberPrice ?? 0) }} <span style="font-size: 11px; color: #8A9288;">(旧价格)</span></div>
        </div>
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
        <!-- V2.8-C: Unified activity images (first one = coverImage) -->
        <div style="font-size: 14px; font-weight: 600; color: #18231E; border-bottom: 1px solid #EDE9DF; padding-bottom: 8px; margin-top: 12px;">活动图片</div>
        <div style="font-size: 12px; color: #7A8178;">第一张将作为列表封面。最多 6 张。点击图片可删除。</div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
          <div v-for="(img, idx) in form.imageUrls" :key="idx" style="position: relative; width: 100px; height: 72px; border-radius: 6px; overflow: hidden; border: 1px solid #EDE9DF; cursor: pointer;" @click="removeImageUrl(idx)">
            <img :src="assetUrl(img)" style="width:100%;height:100%;object-fit:cover;" />
            <span v-if="idx === 0" style="position:absolute;top:2px;left:2px;background:#2E7D5A;color:#fff;font-size:10px;padding:1px 6px;border-radius:3px;">封面</span>
          </div>
          <div v-if="form.imageUrls.length < 6" style="width: 100px; height: 72px; border-radius: 6px; border: 1px dashed #C8CDC7; display: flex; align-items: center; justify-content: center; background: #F7F6F2;">
            <label style="font-size: 11px; color: #8A9288; cursor: pointer; text-align: center; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">+ 上传<input type="file" accept="image/jpeg,image/png,image/webp" style="display:none;" @change="handleImageUrlUpload" /></label>
          </div>
        </div>
        <!-- V2.8-B: contentBlocks editor -->
        <div style="font-size: 14px; font-weight: 600; color: #18231E; border-bottom: 1px solid #EDE9DF; padding-bottom: 8px; margin-top: 12px;">图文介绍</div>
        <div style="font-size: 12px; color: #7A8178;">活动详情图文内容。为空时使用上方"活动描述"纯文本。</div>
        <div v-for="(block, idx) in form.contentBlocks" :key="idx" style="display: flex; gap: 8px; align-items: flex-start; margin-top: 8px;">
          <t-select v-model="block.type" :options="[{label:'文本',value:'text'},{label:'图片',value:'image'}]" style="width: 80px;" size="small" />
          <t-input v-if="block.type === 'text'" v-model="block.text" placeholder="输入文本段落" style="flex: 1;" size="small" />
          <template v-else>
            <t-input v-model="block.url" :placeholder="'图片URL' + (block.url ? '' : ' — 点击右侧上传')" style="flex: 1;" size="small" />
            <label style="font-size: 12px; color: #2E7D5A; cursor: pointer; padding: 6px 8px; white-space: nowrap;">
              {{ blockUploadingIdx === idx ? '上传中...' : '上传' }}<input type="file" accept="image/jpeg,image/png,image/webp" style="display:none;" @change="(e) => handleBlockImageUpload(e, idx, block)" />
            </label>
          </template>
          <t-button theme="default" variant="text" size="small" style="color: #B35B4B; flex-shrink: 0;" @click="form.contentBlocks.splice(idx, 1)">×</t-button>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <t-button theme="default" variant="outline" size="small" @click="form.contentBlocks.push({ type: 'text', text: '' })">+ 文本块</t-button>
          <t-button theme="default" variant="outline" size="small" @click="form.contentBlocks.push({ type: 'image', url: '' })">+ 图片块</t-button>
        </div>
        <div style="font-size: 14px; font-weight: 600; color: #18231E; border-bottom: 1px solid #EDE9DF; padding-bottom: 8px; margin-top: 8px;">时间与名额</div>
        <div style="display: flex; gap: 12px;"><div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">活动开始时间 *</label><t-input v-model="form.startTime" type="datetime-local" /></div><div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">活动结束时间 *</label><t-input v-model="form.endTime" type="datetime-local" /></div></div>
        <div style="display: flex; gap: 12px;"><div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">报名开始时间 *</label><t-input v-model="form.registrationStartTime" type="datetime-local" /></div><div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">报名结束时间 *</label><t-input v-model="form.registrationEndTime" type="datetime-local" /></div></div>
        <div><label style="color: #8A9288; font-size: 13px;">人数上限 *</label><t-input-number v-model="form.capacity" :min="1" style="width: 100%;" /></div>
        <div style="font-size: 14px; font-weight: 600; color: #18231E; border-bottom: 1px solid #EDE9DF; padding-bottom: 8px; margin-top: 8px;">价格与支付</div>
        <div><label style="color: #8A9288; font-size: 13px;">支付模式</label><t-select v-model="form.paymentMode" :options="[{ label: '全款', value: 'FULL' }, { label: '预付+后付', value: 'PREPAY' }]" style="width: 100%;" /></div>
        <template v-if="form.paymentMode === 'PREPAY'"><div style="display: flex; gap: 12px;"><div style="flex: 1;"><label style="color: #8A9288; font-size: 13px;">后付款日期 *</label><t-input v-model="form.postpayDate" type="date" placeholder="如 2026-07-31" /></div></div></template>
        <!-- V2.8-C: Pricing matrix per user type -->
        <div style="font-size: 13px; font-weight: 600; color: #3F6B4F; margin-top: 12px; border-bottom: 1px solid #EDE9DF; padding-bottom: 4px;">价格矩阵（{{ form.paymentMode === 'PREPAY' ? '预付 + 后付' : '全款' }}）</div>
        <div v-if="form.paymentMode === 'FULL'" style="display: flex; flex-direction: column; gap: 6px; margin-top: 8px;">
          <div v-for="(rule, idx) in form.pricingRules" :key="idx" style="display: flex; gap: 8px; align-items: center;">
            <span style="width: 70px; font-size: 13px; color: #18231E; flex-shrink: 0;">{{ rule.label }}</span>
            <t-input-number v-model="rule.fullAmount" :min="0" size="small" style="width: 120px;" placeholder="全款金额" />
            <t-checkbox v-model="rule.enabled" style="margin-left: 4px;">启用</t-checkbox>
          </div>
        </div>
        <div v-else style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
          <div v-for="(rule, idx) in form.pricingRules" :key="idx" style="display: flex; gap: 6px; align-items: center;">
            <span style="width: 70px; font-size: 13px; color: #18231E; flex-shrink: 0;">{{ rule.label }}</span>
            <t-input-number v-model="rule.prepayAmount" :min="0" size="small" style="width: 100px;" placeholder="预付" />
            <t-input-number v-model="rule.postpayAmount" :min="0" size="small" style="width: 100px;" placeholder="后付" />
            <span style="font-size: 12px; color: #8A9288; width: 70px; text-align: right; flex-shrink: 0;">合计 ¥{{ (Number(rule.prepayAmount || 0) + Number(rule.postpayAmount || 0)).toFixed(2) }}</span>
            <t-checkbox v-model="rule.enabled" style="margin-left: 4px;">启用</t-checkbox>
          </div>
        </div>
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
