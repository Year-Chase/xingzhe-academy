<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import type { CSSProperties } from 'vue'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { get, post, patch } from '@/api/client'
import { assetUrl, API_BASE_URL } from '@/config/api'

interface CertTemplate {
  id: number; name: string; description: string; imageUrl: string
  isDefault: boolean; enabled: boolean; fieldConfig: any; updatedAt: string
}

const list = ref<CertTemplate[]>([]); const loading = ref(false)
const formDrawer = ref(false); const formMode = ref<'create' | 'edit'>('create'); const formLoading = ref(false)
const formId = ref(0); const formError = ref('')
const uploadLoading = ref(false)
const specVisible = ref(false)
const canvasRef = ref<HTMLElement | null>(null)
const selectedField = ref('recipientName')
const showSafetyGuide = ref(true)
const draggingField = ref('')
const longTextMode = ref(false)
const previewScale = ref(1)
const backgroundWarning = ref('')
const dragOffset = { x: 0, y: 0 }

const FIELD_KEYS = ['recipientName', 'activityName', 'city', 'activityDate', 'activitySlogan']
const FIELD_LABELS: Record<string, string> = {
  recipientName: '姓名', activityName: '活动名称', city: '活动地点',
  activityDate: '活动时间', activitySlogan: '活动 Slogan',
}
type FontKey = 'system-modern' | 'system-medium' | 'system-serif'
type FieldStyle = { enabled: boolean; label: string; x: number; y: number; width: number; maxLines: 1 | 2; fontKey: FontKey; fontSize: number; fontWeight: 400 | 500 | 600 | 700; color: string; align: 'left' | 'center' | 'right' }
const FIELD_DEFAULTS: Record<string, Omit<FieldStyle, 'enabled' | 'label'>> = {
  recipientName: { x: .12, y: .26, width: .42, maxLines: 1, fontKey: 'system-medium', fontSize: 92, fontWeight: 700, color: '#17372F', align: 'left' },
  activityName: { x: .24, y: .47, width: .38, maxLines: 2, fontKey: 'system-medium', fontSize: 48, fontWeight: 600, color: '#17372F', align: 'left' },
  city: { x: .24, y: .57, width: .16, maxLines: 1, fontKey: 'system-modern', fontSize: 32, fontWeight: 500, color: '#304E42', align: 'left' },
  activityDate: { x: .46, y: .57, width: .20, maxLines: 1, fontKey: 'system-modern', fontSize: 32, fontWeight: 500, color: '#304E42', align: 'left' },
  activitySlogan: { x: .70, y: .10, width: .23, maxLines: 2, fontKey: 'system-serif', fontSize: 40, fontWeight: 500, color: '#304E42', align: 'left' },
}
const NORMAL_VALUES: Record<string, string> = {
  recipientName: '张远行', activityName: '北京城市徒步', city: '北京',
  activityDate: '2026.09.07', activitySlogan: '向山而行',
}
const LONG_VALUES: Record<string, string> = {
  recipientName: '欧阳张远行', activityName: '2026北京城市山野探索徒步特别活动',
  city: '北京市怀柔区雁栖湖国际徒步基地', activityDate: '2026.09.07', activitySlogan: '一座城市，也可以很山野',
}
const FONT_OPTIONS = [
  { label: '现代黑体', value: 'system-modern' },
  { label: '现代粗黑', value: 'system-medium' },
  { label: '系统宋体', value: 'system-serif' },
]
const COLOR_PRESETS = ['#17372F', '#2E7D5A', '#E9654B', '#202522', '#777777', '#FFFFFF']
const createFieldStyle = (key: string, raw?: any): FieldStyle => {
  const fallback = FIELD_DEFAULTS[key]
  const source = typeof raw === 'object' && raw ? raw : {}
  return {
    enabled: typeof raw === 'object' ? (source.visible ?? source.enabled ?? true) !== false : !!raw,
    label: FIELD_LABELS[key] || key,
    ...fallback,
    x: Number(source.x ?? fallback.x) > 1 ? Number(source.x) / 100 : Number(source.x ?? fallback.x),
    y: Number(source.y ?? fallback.y) > 1 ? Number(source.y) / 100 : Number(source.y ?? fallback.y),
    width: Number(source.width ?? fallback.width) > 1 ? Number(source.width) / 100 : Number(source.width ?? fallback.width),
    maxLines: source.maxLines === 1 ? 1 : fallback.maxLines,
    fontKey: source.fontKey === 'system-medium' || source.fontKey === 'system-serif' ? source.fontKey : source.fontFamily === 'serif' ? 'system-serif' : fallback.fontKey,
    fontSize: Number(source.fontSize ?? fallback.fontSize),
    fontWeight: [400, 500, 600, 700].includes(Number(source.fontWeight)) ? Number(source.fontWeight) as FieldStyle['fontWeight'] : fallback.fontWeight,
    color: source.color || fallback.color,
    align: source.align === 'left' || source.align === 'center' || source.align === 'right' ? source.align : fallback.align,
  }
}
const defaultFieldConfig = () => Object.fromEntries(FIELD_KEYS.map(k => [k, createFieldStyle(k, { enabled: true })])) as Record<string, FieldStyle>

const form = reactive({
  name: '', description: '', imageUrl: '', isDefault: false, enabled: true,
  fieldConfig: defaultFieldConfig() as Record<string, FieldStyle>,
})

const resetForm = () => {
  form.name = ''; form.description = ''; form.imageUrl = ''; form.isDefault = false; form.enabled = true
  form.fieldConfig = defaultFieldConfig(); formError.value = ''; backgroundWarning.value = ''; longTextMode.value = false
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
  } catch (e: any) {
    console.error('[certificate-template] fetchList failed', e)
    MessagePlugin.error(e?.response?.data?.message || e?.message || '加载失败')
  } finally { loading.value = false }
}

const openCreate = () => { resetForm(); selectedField.value = 'recipientName'; formMode.value = 'create'; formId.value = 0; formDrawer.value = true }
const openEdit = (row: CertTemplate) => {
  formMode.value = 'edit'; formId.value = row.id
  form.name = row.name; form.description = row.description || ''; form.imageUrl = row.imageUrl
  form.isDefault = row.isDefault; form.enabled = row.enabled
  form.fieldConfig = parseFieldConfig(row.fieldConfig); selectedField.value = FIELD_KEYS.find(k => form.fieldConfig[k].enabled) || 'recipientName'
  formError.value = ''; formDrawer.value = true
}

const handleUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement)?.files?.[0]; if (!file) return
  const allowedTypes = new Set(['image/jpeg', 'image/png'])
  if (!allowedTypes.has(file.type)) { MessagePlugin.error('仅支持 JPG、JPEG、PNG 图片'); return }
  if (file.size > 5 * 1024 * 1024) { MessagePlugin.error('证书底图不能超过 5MB'); return }
  inspectImageRatio(file)
  uploadLoading.value = true
  try {
    const fd = new FormData(); fd.append('file', file)
    const token = localStorage.getItem('admin_token')
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`${API_BASE_URL}/admin/certificate-templates/upload`, { method: 'POST', headers, body: fd })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const message = Array.isArray(data?.message) ? data.message.join('；') : data?.message
      MessagePlugin.error(message || `上传失败（${res.status}）`)
      return
    }
    form.imageUrl = data.url || data?.data?.url || data?.imageUrl || ''
    if (!form.imageUrl) { MessagePlugin.error('证书底图上传失败'); return }
    MessagePlugin.success('上传成功')
  } catch (e: any) { console.error('cert-template upload', e); MessagePlugin.error(errorMessage(e, '上传失败')) }
  finally { uploadLoading.value = false }
}

const submitForm = async () => {
  if (!form.name || !form.imageUrl) { formError.value = '模板名称和证书底图为必填项'; return }
  const invalidColor = FIELD_KEYS.find(key => !/^#[0-9A-Fa-f]{6}$/.test(form.fieldConfig[key].color))
  if (invalidColor) { formError.value = `${FIELD_LABELS[invalidColor]}颜色必须为 #RRGGBB 格式`; return }
  formLoading.value = true; formError.value = ''
  const body: any = {
    name: form.name, description: form.description, imageUrl: form.imageUrl,
    isDefault: form.isDefault, enabled: form.enabled,
    fieldConfig: {
      canvas: { width: 1754, height: 1240 },
      fields: Object.fromEntries(FIELD_KEYS.map(k => [k, {
        visible: form.fieldConfig[k].enabled,
        x: form.fieldConfig[k].x, y: form.fieldConfig[k].y, width: form.fieldConfig[k].width,
        maxLines: form.fieldConfig[k].maxLines, fontKey: form.fieldConfig[k].fontKey,
        fontSize: form.fieldConfig[k].fontSize, fontWeight: form.fieldConfig[k].fontWeight,
        color: form.fieldConfig[k].color, align: form.fieldConfig[k].align,
      }])),
    },
  }
  try {
    if (formMode.value === 'create') { await post('/admin/certificate-templates', body) }
    else { await patch('/admin/certificate-templates/' + formId.value, body) }
    MessagePlugin.success(formMode.value === 'create' ? '创建成功' : '保存成功')
    formDrawer.value = false; fetchList()
  } catch (e: any) { formError.value = errorMessage(e, '保存失败') }
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
  if (url.startsWith('/uploads/')) return assetUrl(url)
  return url
}

function parseFieldConfig(raw: any): Record<string, FieldStyle> {
  if (!raw) return defaultFieldConfig()
  // Back-end stores as JSON string; parse if needed
  let obj = raw
  if (typeof raw === 'string') {
    try { obj = JSON.parse(raw) } catch { return defaultFieldConfig() }
  }
  const fields = obj?.fields || obj
  const result: Record<string, FieldStyle> = {}
  for (const k of FIELD_KEYS) {
    const legacyKey = k === 'city' ? 'location' : k === 'activityDate' ? 'issuedAt' : k
    result[k] = createFieldStyle(k, fields?.[k] ?? fields?.[legacyKey])
  }
  return result
}

const previewFieldStyle = (key: string) => {
  const field = form.fieldConfig[key]
  const family = field.fontKey === 'system-serif' ? '"Songti SC", SimSun, serif' : '"PingFang SC", "Microsoft YaHei", sans-serif'
  return {
    left: `${field.x * 100}%`, top: `${field.y * 100}%`, width: `${field.width * 100}%`, color: field.color,
    fontFamily: family, fontSize: `${fitLogicalFontSize(key) * previewScale.value}px`, fontWeight: field.fontWeight,
    textAlign: field.align, display: '-webkit-box', WebkitLineClamp: field.maxLines, WebkitBoxOrient: 'vertical',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: field.maxLines === 1 ? 'nowrap' : 'normal',
  } as CSSProperties
}
const canvasFieldStyle = (key: string): CSSProperties => ({
  position: 'absolute', lineHeight: 1.1, cursor: 'grab', userSelect: 'none', padding: '5px 7px',
  border: selectedField.value === key ? '1px solid #2E7D5A' : '1px solid transparent',
  background: selectedField.value === key ? 'rgba(255,255,255,.72)' : 'transparent', borderRadius: '3px',
  ...previewFieldStyle(key),
})
const simulatedValues = () => longTextMode.value ? LONG_VALUES : NORMAL_VALUES
const textUnits = (value: string) => [...value].reduce((sum, char) => sum + (/^[\x00-\x7F]$/.test(char) ? .56 : 1), 0)
const minFontSize = (key: string) => key === 'recipientName' ? 48 : key === 'activityName' ? 30 : key === 'activitySlogan' ? 26 : 22
const maxFontSize = (key: string) => key === 'recipientName' ? 120 : key === 'activityName' ? 72 : key === 'activitySlogan' ? 64 : 48
const fitLogicalFontSize = (key: string) => {
  const field = form.fieldConfig[key]
  const available = field.width * 1754
  return Math.max(minFontSize(key), Math.min(field.fontSize, available * field.maxLines / Math.max(1, textUnits(simulatedValues()[key]))))
}
const clampCoordinate = (value: number, max: number) => Math.max(.08, Math.min(max, value))
const startDrag = (event: PointerEvent, key: string) => {
  selectedField.value = key
  draggingField.value = key
  const rect = canvasRef.value?.getBoundingClientRect()
  if (rect) {
    dragOffset.x = (event.clientX - rect.left) / rect.width - form.fieldConfig[key].x
    dragOffset.y = (event.clientY - rect.top) / rect.height - form.fieldConfig[key].y
  }
  ;(event.currentTarget as HTMLElement)?.setPointerCapture?.(event.pointerId)
}
const moveDrag = (event: PointerEvent) => {
  const key = draggingField.value
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!key || !rect) return
  const field = form.fieldConfig[key]
  form.fieldConfig[key].x = clampCoordinate((event.clientX - rect.left) / rect.width - dragOffset.x, .92 - field.width)
  form.fieldConfig[key].y = clampCoordinate((event.clientY - rect.top) / rect.height - dragOffset.y, field.maxLines === 2 ? .80 : .86)
}
const stopDrag = () => { draggingField.value = '' }
const restoreDefaultPosition = () => {
  const current = form.fieldConfig[selectedField.value]
  const fallback = FIELD_DEFAULTS[selectedField.value]
  current.x = fallback.x; current.y = fallback.y
}
const restoreDefaultLayout = () => { form.fieldConfig = defaultFieldConfig(); selectedField.value = 'recipientName' }
const selectedFieldNearEdge = () => {
  const field = form.fieldConfig[selectedField.value]
  return field && (field.x <= .09 || field.y <= .09 || field.x + field.width >= .91 || field.y >= .84)
}
const updatePreviewScale = () => { if (canvasRef.value) previewScale.value = canvasRef.value.clientWidth / 1754 }
const inspectImageRatio = (file: File) => {
  const url = URL.createObjectURL(file)
  const probe = new Image()
  probe.onload = () => {
    const expected = 1754 / 1240
    backgroundWarning.value = Math.abs(probe.width / probe.height - expected) / expected > .03 ? `当前图片 ${probe.width} × ${probe.height}，比例与推荐横版不一致，可能造成留白。` : ''
    URL.revokeObjectURL(url)
  }
  probe.src = url
}
function errorMessage(error: any, fallback: string) {
  const message = error?.response?.data?.message || error?.message
  return Array.isArray(message) ? message.join('；') : message || fallback
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

onMounted(() => {
  fetchList()
  window.addEventListener('pointermove', moveDrag)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('resize', updatePreviewScale)
})
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', moveDrag)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('resize', updatePreviewScale)
})
watch(formDrawer, async visible => { if (visible) { await nextTick(); updatePreviewScale() } })
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
          <img v-if="row.imageUrl" :src="imgUrl(row.imageUrl)" style="width:72px;height:51px;object-fit:contain;border-radius:4px;border:1px solid #EDE9DF;background:#F7F6F2;" />
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

    <t-drawer v-model:visible="formDrawer" :header="formMode === 'create' ? '新增证书模板' : '编辑证书模板'" size="1120px" :footer="false">
      <div style="display:grid;grid-template-columns:minmax(0,1.65fr) minmax(310px,.8fr);gap:24px;padding-bottom:16px;">
        <section>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
            <strong style="color:#18231E;">证书实时预览</strong>
            <div style="display:flex;align-items:center;gap:12px;"><t-checkbox v-model="longTextMode">长文本测试</t-checkbox><t-checkbox v-model="showSafetyGuide">显示 8% 安全区</t-checkbox></div>
          </div>
          <div ref="canvasRef" style="position:relative;width:100%;aspect-ratio:1754 / 1240;overflow:hidden;background:#EDF4EF;border:1px solid #D7E5DA;border-radius:6px;touch-action:none;">
            <img v-if="form.imageUrl" :src="imgUrl(form.imageUrl)" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none;" />
            <div v-if="showSafetyGuide" style="position:absolute;inset:8%;border:1px dashed rgba(46,125,90,.7);pointer-events:none;"></div>
            <span v-if="showSafetyGuide" style="position:absolute;top:6px;left:8px;font-size:10px;color:#2E7D5A;background:rgba(255,255,255,.86);padding:1px 4px;pointer-events:none;">安全区</span>
            <template v-for="k in FIELD_KEYS" :key="k">
              <span v-if="form.fieldConfig[k].enabled" @pointerdown.prevent.stop="startDrag($event, k)" :style="canvasFieldStyle(k)">
                {{ simulatedValues()[k] }}
              </span>
            </template>
            <span v-if="!form.imageUrl" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#6D7A70;font-size:14px;pointer-events:none;">上传底图后开始排版</span>
          </div>
          <p style="margin:10px 0 0;color:#8A9288;font-size:12px;">点击字段后拖动定位；拖动会限制在 8% 安全区域内。</p>
          <p v-if="selectedFieldNearEdge()" style="margin:8px 0 0;color:#A66A16;font-size:12px;">该内容接近安全区边缘，可能在不同尺寸下显示不完整。</p>
        </section>

        <section style="display:flex;flex-direction:column;gap:14px;">
          <div><label style="color:#8A9288;font-size:13px;">模板名称<span style="color:#B35B4B;"> *</span></label><t-input v-model="form.name" placeholder="例如：山野徒步证书模板" /></div>
          <div><label style="color:#8A9288;font-size:13px;">模板说明</label><t-input v-model="form.description" placeholder="可选" /></div>

          <div style="padding:12px;border:1px solid #E6ECE7;border-radius:6px;">
            <div style="display:flex;align-items:center;justify-content:space-between;"><strong style="font-size:14px;color:#18231E;">1. 底图</strong><t-button theme="default" variant="text" size="small" @click="specVisible = true">查看规范</t-button></div>
            <input type="file" accept="image/jpeg,image/png" @change="handleUpload" style="font-size:13px;margin-top:8px;max-width:100%;" />
            <span style="font-size:11px;color:#8A9288;display:block;margin-top:6px;">推荐尺寸：1754 × 1240 px（A4横版）<br />建议四周至少保留 8% 安全留白；重要 Logo/固定文字不要贴近边缘；动态字段建议放在画布中部安全区域。</span>
            <span v-if="backgroundWarning" style="font-size:11px;color:#A66A16;display:block;margin-top:6px;">{{ backgroundWarning }}</span>
          </div>

          <div style="padding:12px;border:1px solid #E6ECE7;border-radius:6px;">
            <strong style="font-size:14px;color:#18231E;">2. 显示字段</strong>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;">
              <t-checkbox v-for="k in FIELD_KEYS" :key="k" v-model="form.fieldConfig[k].enabled" @change="selectedField = k">{{ FIELD_LABELS[k] }}</t-checkbox>
            </div>
          </div>

          <div v-if="form.fieldConfig[selectedField]" style="padding:12px;border:1px solid #E6ECE7;border-radius:6px;">
            <div style="display:flex;justify-content:space-between;align-items:center;"><strong style="font-size:14px;color:#18231E;">3. 字段样式：{{ FIELD_LABELS[selectedField] }}</strong><t-button theme="default" variant="text" size="small" @click="restoreDefaultPosition">恢复默认位置</t-button></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;">
              <div><span style="font-size:11px;color:#8A9288;">字体</span><t-select v-model="form.fieldConfig[selectedField].fontKey" :options="FONT_OPTIONS" /></div>
              <div><span style="font-size:11px;color:#8A9288;">字号</span><t-input-number v-model="form.fieldConfig[selectedField].fontSize" :min="minFontSize(selectedField)" :max="maxFontSize(selectedField)" :step="1" /></div>
              <div style="grid-column:1 / -1;"><span style="font-size:11px;color:#8A9288;">字重</span><t-radio-group v-model="form.fieldConfig[selectedField].fontWeight" variant="default-filled"><t-radio-button :value="400">常规</t-radio-button><t-radio-button :value="500">中等</t-radio-button><t-radio-button :value="600">半粗</t-radio-button><t-radio-button :value="700">粗体</t-radio-button></t-radio-group></div>
              <div style="grid-column:1 / -1;"><span style="font-size:11px;color:#8A9288;">主题颜色</span><div style="display:flex;gap:8px;margin-top:5px;"> <button v-for="color in COLOR_PRESETS" :key="color" type="button" :title="color" @click="form.fieldConfig[selectedField].color = color" :style="{width:'26px',height:'26px',borderRadius:'50%',background:color,border:form.fieldConfig[selectedField].color === color ? '3px solid #4C84FF' : '1px solid #CBD3CD',boxShadow:color === '#FFFFFF' ? 'inset 0 0 0 1px #D8DDD9' : 'none',cursor:'pointer'}"></button></div><div style="display:flex;gap:6px;align-items:center;margin-top:8px;"><t-input v-model="form.fieldConfig[selectedField].color" placeholder="#17372F" /><input v-model="form.fieldConfig[selectedField].color" type="color" title="选择颜色" style="width:34px;height:30px;border:0;background:transparent;" /></div></div>
              <div><span style="font-size:11px;color:#8A9288;">对齐</span><t-select v-model="form.fieldConfig[selectedField].align" :options="[{label:'左对齐',value:'left'},{label:'居中',value:'center'},{label:'右对齐',value:'right'}]" /></div>
            </div>
          </div>

          <div style="padding:12px;border:1px solid #E6ECE7;border-radius:6px;"><div style="display:flex;align-items:center;justify-content:space-between;"><strong style="font-size:14px;color:#18231E;">4. 安全区</strong><t-button theme="default" variant="text" size="small" @click="restoreDefaultLayout">恢复默认布局</t-button></div><span style="display:block;margin-top:6px;color:#8A9288;font-size:11px;">动态文字限制在四周 8% 安全区；底图装饰不受限制。</span></div>

          <div style="display:flex;gap:12px;">
            <t-checkbox v-model="form.isDefault">设为默认模板</t-checkbox>
            <t-checkbox v-model="form.enabled">启用</t-checkbox>
          </div>
          <div v-if="formError" style="color:#B35B4B;font-size:13px;white-space:pre-wrap;">{{ formError }}</div>
          <div style="display:flex;gap:12px;margin-top:auto;">
            <t-button @click="formDrawer = false" style="flex:1;height:40px;">取消</t-button>
            <t-button @click="submitForm" :loading="formLoading" style="flex:1;height:40px;background:#2E7D5A;border-color:#2E7D5A;color:#fff;">{{ formMode === 'create' ? '创建模板' : '保存模板' }}</t-button>
          </div>
        </section>
      </div>
    </t-drawer>

    <t-dialog v-model:visible="specVisible" header="证书模板规范" :footer="false" width="580px">
      <div style="display:flex;flex-direction:column;gap:12px;color:#4E5A52;line-height:1.65;">
        <div><strong style="color:#18231E;">画布</strong><br />1754 × 1240 px，横版 1.414:1；仅 JPG / JPEG / PNG，文件不超过 5MB。</div>
        <div style="position:relative;aspect-ratio:1754 / 1240;background:#EEF5EF;border:1px solid #D7E5DA;">
          <div style="position:absolute;inset:8%;border:2px dashed #2E7D5A;"></div>
          <span style="position:absolute;top:8px;left:12px;font-size:12px;color:#2E7D5A;">文字安全区</span>
        </div>
        <div>姓名、活动名称等文字请放在安全区内，避开边缘、印章、二维码和复杂纹理。活动名称建议控制在两行内；字段位置、字号、颜色和对齐以右侧模拟预览为准。</div>
      </div>
    </t-dialog>
  </div>
</template>
