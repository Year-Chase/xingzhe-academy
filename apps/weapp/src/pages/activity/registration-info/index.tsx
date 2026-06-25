import { View, Text, Input, Picker } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { getUserId, ensureUserId } from '../../../utils/user'

const API = 'http://172.20.10.10:3000'

const C = {
  bg: '#F7F6F2', white: '#FFFFFF', green: '#3F6B4F', dark: '#18231E',
  body: '#3E463F', neutral: '#7A8178', secondary: '#A6AAA2',
  lightGreen: '#EEF5EF', border: '#EDE9DF', danger: '#B35B4B',
}

const FIELD_LABELS: Record<string, string> = {
  realName: '真实姓名', phone: '手机号', idCardNo: '身份证号',
  departureCity: '出发城市', transportPreference: '交通工具偏好', roomPreference: '房间偏好',
}
const TRANSPORT = ['自驾', '高铁', '飞机', '大巴', '其他']
const ROOM = ['无特殊要求', '单人间', '双人间', '愿意拼房', '其他']

function maskPhone(p: string) { return p.length >= 11 ? p.slice(0, 3) + '****' + p.slice(7) : p }
function maskIdCard(v: string) { return v.length >= 8 ? v.slice(0, 3) + '***********' + v.slice(-4).toUpperCase() : v }
const idCardRx = /^(?:\d{15}|\d{17}[\dXx])$/
const phoneRx = /^1\d{10}$/

function safeFields(raw: any): string[] {
  if (Array.isArray(raw)) return raw
  if (!raw) return []
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v : [] } catch { return [] }
}

interface FormData { [key: string]: string }

export default function RegistrationInfoPage() {
  const router = useRouter()
  const [activityId, setActivityId] = useState(0)
  const [requiredFields, setRequiredFields] = useState<string[]>([])
  const [form, setForm] = useState<FormData>({})
  const [errors, setErrors] = useState<FormData>({})
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Parse activityId from URL; fetch requiredUserInfoFields from API
  useEffect(() => {
    const p = router.params as any
    const id = Number(p.activityId)
    if (!id || Number.isNaN(id)) return
    setActivityId(id)
    // Read required fields from activity detail
    Taro.request({ url: `${API}/activity/${id}` }).then(res => {
      const fields = safeFields((res.data as any)?.requiredUserInfoFields)
      setRequiredFields(fields)
    }).catch(() => {})
  }, [router.params])

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const validate = (): boolean => {
    const e: FormData = {}
    for (const f of requiredFields) {
      const v = (form[f] || '').trim()
      if (!v) { e[f] = '请填写' + (FIELD_LABELS[f] || f) }
      else if (f === 'realName' && (v.length < 2 || v.length > 20)) e[f] = '请填写真实姓名'
      else if (f === 'phone' && !phoneRx.test(v)) e[f] = '请填写正确的手机号'
      else if (f === 'idCardNo' && !idCardRx.test(v)) e[f] = '请填写正确的身份证号'
      else if (f === 'departureCity' && v.length > 30) e[f] = '出发城市最多30字'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleConfirm = () => {
    if (!validate()) return
    // Normalize idCardNo x→X in form state
    const normalized: FormData = {}
    for (const k of Object.keys(form)) {
      const v = form[k].trim()
      normalized[k] = k === 'idCardNo' ? v.replace(/x$/, 'X') : v
    }
    setForm(normalized)
    setShowConfirm(true)
  }

  // Directly call enrollPay from this page
  const handleSubmit = async () => {
    const uid = await ensureUserId()
    if (!uid) return

    setSubmitting(true)
    try {
      const regInfo: any = {}
      for (const k of Object.keys(form)) regInfo[k] = form[k]

      const res = await Taro.request({
        method: 'POST',
        url: `${API}/activity/${activityId}/enroll-pay?userId=${uid}`,
        data: { registrationInfo: regInfo },
        header: { 'content-type': 'application/json' },
      })

      if ((res.data as any)?.status === 'PAID') {
        // Clear form state from memory
        setForm({})
        setShowConfirm(false)
        Taro.setStorageSync('dirtyActivityId', activityId)
        Taro.showToast({ title: '报名成功', icon: 'success', duration: 1500 })
        // Navigate back to detail with success flag only — no sensitive data
        setTimeout(() => {
          Taro.redirectTo({ url: `/pages/activity/detail/index?id=${activityId}&enrollSuccess=1` })
        }, 600)
      } else if ((res.data as any)?.message) {
        Taro.showToast({ title: (res.data as any).message, icon: 'none' })
      }
    } catch {
      Taro.showToast({ title: '操作失败，请重试', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleModify = () => setShowConfirm(false)

  const renderField = (key: string) => {
    const val = form[key] || ''
    const err = errors[key] || ''
    const label = FIELD_LABELS[key] || key

    if (showConfirm) {
      let display = val
      if (key === 'phone') display = maskPhone(val)
      if (key === 'idCardNo') display = maskIdCard(val)
      return (
        <View key={key} style={confirmRow}>
          <Text style={{ fontSize: '28rpx', color: C.neutral, width: '160rpx', flexShrink: 0 }}>{label}</Text>
          <Text style={{ fontSize: '28rpx', color: C.dark, flex: 1, textAlign: 'right', overflow: 'hidden' }}>{display || '-'}</Text>
        </View>
      )
    }

    if (key === 'transportPreference') {
      const idx = TRANSPORT.indexOf(val)
      return (
        <View key={key} style={fieldBox}>
          <Text style={fieldLabel}>{label}</Text>
          <Picker mode='selector' range={TRANSPORT} value={idx >= 0 ? idx : 0} onChange={e => updateField(key, TRANSPORT[Number(e.detail.value)])}>
            <Text style={{ fontSize: '28rpx', color: val ? C.dark : C.secondary }}>{val || '请选择'} ▾</Text>
          </Picker>
          {err ? <Text style={errStyle}>{err}</Text> : null}
        </View>
      )
    }
    if (key === 'roomPreference') {
      const idx = ROOM.indexOf(val)
      return (
        <View key={key} style={fieldBox}>
          <Text style={fieldLabel}>{label}</Text>
          <Picker mode='selector' range={ROOM} value={idx >= 0 ? idx : 0} onChange={e => updateField(key, ROOM[Number(e.detail.value)])}>
            <Text style={{ fontSize: '28rpx', color: val ? C.dark : C.secondary }}>{val || '请选择'} ▾</Text>
          </Picker>
          {err ? <Text style={errStyle}>{err}</Text> : null}
        </View>
      )
    }
    const isPhone = key === 'phone'
    const isIdCard = key === 'idCardNo'
    return (
      <View key={key} style={fieldBox}>
        <Text style={fieldLabel}>{label}</Text>
        <Input value={val} onInput={e => updateField(key, e.detail.value)} placeholder={'请填写' + label}
          maxlength={isPhone ? 11 : isIdCard ? 18 : 50}
          style={{ flex: 1, fontSize: '28rpx', color: C.dark, textAlign: 'right' }}
          type={isPhone ? 'number' : 'text'} />
        {key === 'idCardNo' ? <Text style={{ fontSize: '22rpx', color: '#C98255', display: 'block', marginTop: '6rpx' }}>身份证号属于敏感信息，仅在保险、住宿、实名核验等确有必要时使用。</Text> : null}
        {err ? <Text style={errStyle}>{err}</Text> : null}
      </View>
    )
  }

  if (activityId === 0) {
    return <View style={center}><Text style={{ color: C.secondary, fontSize: '28rpx' }}>参数异常</Text></View>
  }

  return (
    <View style={{ minHeight: '100vh', background: C.bg, paddingBottom: '120rpx' }}>
      <View style={{ padding: '32rpx 32rpx 16rpx' }}>
        <Text style={{ fontSize: '34rpx', fontWeight: '700', color: C.dark, display: 'block' }}>
          {showConfirm ? '确认报名信息' : '报名信息'}
        </Text>
        <Text style={{ fontSize: '26rpx', color: C.neutral, display: 'block', marginTop: '8rpx' }}>
          本信息仅用于本次活动组织与安全保障。
        </Text>
      </View>

      <View style={{ margin: '0 32rpx', background: C.white, borderRadius: '24rpx', padding: '28rpx 32rpx', border: `1rpx solid ${C.border}` }}>
        {requiredFields.map(renderField)}
      </View>

      <View style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: '20rpx 32rpx', paddingBottom: 'calc(20rpx + env(safe-area-inset-bottom))', background: 'rgba(247,246,242,0.96)', boxShadow: '0 -8rpx 24rpx rgba(24,35,30,0.06)', zIndex: 10, display: 'flex', flexDirection: 'row', gap: '16rpx' }}>
        {showConfirm ? (
          <>
            <View onClick={handleModify} style={{ flex: 1, height: '88rpx', borderRadius: '999rpx', background: C.white, border: `1rpx solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: '30rpx', color: C.neutral }}>修改信息</Text>
            </View>
            <View onClick={handleSubmit} style={{ flex: 2, height: '88rpx', borderRadius: '999rpx', background: submitting ? '#E9EAE5' : C.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: '30rpx', fontWeight: '600', color: '#FFFFFF' }}>{submitting ? '提交中...' : '确认无误，继续支付'}</Text>
            </View>
          </>
        ) : (
          <View onClick={handleConfirm} style={{ flex: 1, height: '88rpx', borderRadius: '999rpx', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: '30rpx', fontWeight: '600', color: '#FFFFFF' }}>确认信息，继续</Text>
          </View>
        )}
      </View>
    </View>
  )
}

const center: React.CSSProperties = { minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const fieldBox: React.CSSProperties = { display: 'flex', flexDirection: 'column', padding: '20rpx 0', borderBottom: `1rpx solid ${C.border}` }
const fieldLabel: React.CSSProperties = { fontSize: '28rpx', color: C.neutral, marginBottom: '6rpx' }
const confirmRow: React.CSSProperties = { display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '16rpx 0', borderBottom: `1rpx solid ${C.border}` }
const errStyle: React.CSSProperties = { fontSize: '23rpx', color: C.danger, marginTop: '6rpx' }
