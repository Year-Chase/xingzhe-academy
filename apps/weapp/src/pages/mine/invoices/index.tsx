import { View, Text, Input, Picker, ScrollView } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { API_BASE_URL as API } from '../../../config/api'
import { getStoredToken, getUserId, isLoggedIn, userAuthHeader } from '../../../utils/user'

const C = {
  bg: '#F7F6F2',
  white: '#FFFFFF',
  green: '#3F6B4F',
  dark: '#18231E',
  body: '#3E463F',
  neutral: '#7A8178',
  secondary: '#A6AAA2',
  lightGreen: '#EEF5EF',
  border: '#EDE9DF',
}

type InvoiceType = 'PERSONAL' | 'COMPANY'

interface InvoiceProfile {
  invoiceType: InvoiceType
  invoiceTitle: string
  taxNumber: string
  companyAddress: string
  companyPhone: string
  bankName: string
  bankAccount: string
  email: string
  remark: string
}

interface InvoiceOrder {
  orderId: number
  activityTitle: string
  amount: number
  payType: string
  createdAt: string
  canApply: boolean
  reason: string
  existingInvoiceStatus: string | null
}

interface InvoiceRequest {
  id: number
  orderId: number
  activityTitle: string
  amount: number
  invoiceType: InvoiceType
  invoiceTitle: string
  taxNumber: string
  status: string
  createdAt: string
  issuedAt: string | null
}

const emptyProfile: InvoiceProfile = {
  invoiceType: 'PERSONAL',
  invoiceTitle: '',
  taxNumber: '',
  companyAddress: '',
  companyPhone: '',
  bankName: '',
  bankAccount: '',
  email: '',
  remark: '',
}

export default function InvoicePage() {
  const [profile, setProfile] = useState<InvoiceProfile>(emptyProfile)
  const [orders, setOrders] = useState<InvoiceOrder[]>([])
  const [requests, setRequests] = useState<InvoiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [actingOrderId, setActingOrderId] = useState<number | null>(null)

  const auth = () => {
    const uid = getUserId()
    const token = getStoredToken()
    if (!uid || !token) throw new Error('请先完成登录')
    return { uid, header: userAuthHeader() }
  }

  const load = async () => {
    if (!isLoggedIn()) {
      Taro.reLaunch({ url: '/pages/auth/login/index' })
      return
    }
    setLoading(true)
    try {
      const { uid, header } = auth()
      const [profileRes, ordersRes, requestsRes] = await Promise.all([
        Taro.request({ url: `${API}/users/me/invoice-profile?userId=${uid}`, header }).catch(() => ({ data: null })),
        Taro.request({ url: `${API}/users/me/invoice-orders?userId=${uid}`, header }),
        Taro.request({ url: `${API}/users/me/invoice-requests?userId=${uid}`, header }),
      ])
      const p = profileRes.data as any
      setProfile(p ? {
        invoiceType: p.invoiceType || 'PERSONAL',
        invoiceTitle: p.invoiceTitle || '',
        taxNumber: p.taxNumber || '',
        companyAddress: p.companyAddress || '',
        companyPhone: p.companyPhone || '',
        bankName: p.bankName || '',
        bankAccount: p.bankAccount || '',
        email: p.email || '',
        remark: p.remark || '',
      } : emptyProfile)
      setOrders((ordersRes.data || []) as InvoiceOrder[])
      setRequests((requestsRes.data || []) as InvoiceRequest[])
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useDidShow(() => { load() })

  const saveProfile = async () => {
    if (saving) return
    if (!profile.invoiceTitle.trim()) {
      Taro.showToast({ title: '请填写发票抬头', icon: 'none' })
      return
    }
    if (profile.invoiceType === 'COMPANY' && !profile.taxNumber.trim()) {
      Taro.showToast({ title: '企业发票请填写税号', icon: 'none' })
      return
    }
    setSaving(true)
    try {
      const { uid, header } = auth()
      const res = await Taro.request({
        method: 'PUT',
        url: `${API}/users/me/invoice-profile?userId=${uid}`,
        data: profile,
        header: { 'content-type': 'application/json', ...header },
      })
      if (res.statusCode < 200 || res.statusCode >= 300) throw new Error((res.data as any)?.message || '保存失败')
      Taro.showToast({ title: '保存成功', icon: 'success' })
      load()
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  const submitRequest = async (order: InvoiceOrder) => {
    if (!order.canApply || actingOrderId) {
      if (order.reason) Taro.showToast({ title: order.reason, icon: 'none' })
      return
    }
    if (!profile.invoiceTitle.trim()) {
      Taro.showToast({ title: '请先保存默认开票信息', icon: 'none' })
      return
    }
    if (profile.invoiceType === 'COMPANY' && !profile.taxNumber.trim()) {
      Taro.showToast({ title: '企业发票请填写税号', icon: 'none' })
      return
    }
    setActingOrderId(order.orderId)
    try {
      const { uid, header } = auth()
      const res = await Taro.request({
        method: 'POST',
        url: `${API}/users/me/invoice-requests?userId=${uid}`,
        data: { orderId: order.orderId },
        header: { 'content-type': 'application/json', ...header },
      })
      if (res.statusCode < 200 || res.statusCode >= 300) throw new Error((res.data as any)?.message || '提交失败')
      Taro.showToast({ title: '开票申请已提交，请等待处理', icon: 'none' })
      load()
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '提交失败', icon: 'none' })
    } finally {
      setActingOrderId(null)
    }
  }

  if (loading) {
    return <View style={center}><Text style={{ fontSize: '28rpx', color: C.secondary }}>加载中...</Text></View>
  }

  return (
    <ScrollView scrollY style={{ minHeight: '100vh', background: C.bg }}>
      <View style={{ padding: '28rpx 32rpx 80rpx' }}>
        <Section title='默认开票信息'>
          <FormRow label='发票类型'>
            <Picker mode='selector' range={['个人', '企业']} value={profile.invoiceType === 'COMPANY' ? 1 : 0} onChange={e => setProfile({ ...profile, invoiceType: Number(e.detail.value) === 1 ? 'COMPANY' : 'PERSONAL' })}>
              <Text style={{ fontSize: '28rpx', color: C.dark }}>{profile.invoiceType === 'COMPANY' ? '企业' : '个人'} ▾</Text>
            </Picker>
          </FormRow>
          <FormInput label='发票抬头' value={profile.invoiceTitle} placeholder='请输入发票抬头' onChange={invoiceTitle => setProfile({ ...profile, invoiceTitle })} />
          {profile.invoiceType === 'COMPANY' && (
            <FormInput label='税号' value={profile.taxNumber} placeholder='企业发票请填写税号' onChange={taxNumber => setProfile({ ...profile, taxNumber })} />
          )}
          <FormInput label='单位地址' value={profile.companyAddress} placeholder='选填' onChange={companyAddress => setProfile({ ...profile, companyAddress })} />
          <FormInput label='单位电话' value={profile.companyPhone} placeholder='选填' onChange={companyPhone => setProfile({ ...profile, companyPhone })} />
          <FormInput label='开户行' value={profile.bankName} placeholder='选填' onChange={bankName => setProfile({ ...profile, bankName })} />
          <FormInput label='银行账号' value={profile.bankAccount} placeholder='选填' onChange={bankAccount => setProfile({ ...profile, bankAccount })} />
          <FormInput label='接收邮箱' value={profile.email} placeholder='选填' onChange={email => setProfile({ ...profile, email })} />
          <FormInput label='备注' value={profile.remark} placeholder='选填' onChange={remark => setProfile({ ...profile, remark })} last />
          <View onClick={saveProfile} style={primaryBtn(saving)}>
            <Text style={{ fontSize: '28rpx', color: '#FFFFFF', fontWeight: '600' }}>{saving ? '保存中...' : '保存默认开票信息'}</Text>
          </View>
        </Section>

        <Section title='可申请订单'>
          {orders.length === 0 ? (
            <Empty text='暂无可申请开票的订单' />
          ) : orders.map(order => (
            <View key={order.orderId} style={itemCard}>
              <Text style={itemTitle}>{order.activityTitle || `订单 ${order.orderId}`}</Text>
              <Text style={itemMeta}>订单号：{order.orderId} · 金额：¥{Number(order.amount || 0).toFixed(2)}</Text>
              {order.reason ? <Text style={itemHint}>{order.reason}</Text> : null}
              <View onClick={() => submitRequest(order)} style={smallBtn(order.canApply && actingOrderId !== order.orderId)}>
                <Text style={{ fontSize: '24rpx', color: order.canApply ? '#FFFFFF' : C.secondary }}>{actingOrderId === order.orderId ? '提交中...' : order.existingInvoiceStatus ? statusLabel(order.existingInvoiceStatus) : '提交开票申请'}</Text>
              </View>
            </View>
          ))}
        </Section>

        <Section title='开票申请记录'>
          {requests.length === 0 ? (
            <Empty text='暂无开票申请记录' />
          ) : requests.map(req => (
            <View key={req.id} style={itemCard}>
              <Text style={itemTitle}>{req.activityTitle || `订单 ${req.orderId}`}</Text>
              <Text style={itemMeta}>申请ID：{req.id} · 金额：¥{Number(req.amount || 0).toFixed(2)}</Text>
              <Text style={itemMeta}>抬头：{req.invoiceTitle}</Text>
              {req.taxNumber ? <Text style={itemMeta}>税号：{req.taxNumber}</Text> : null}
              <Text style={{ fontSize: '24rpx', color: req.status === 'ISSUED' ? C.green : '#8A6D3B', marginTop: '8rpx' }}>{statusLabel(req.status)}</Text>
            </View>
          ))}
        </Section>
      </View>
    </ScrollView>
  )
}

function Section({ title, children }: { title: string; children: any }) {
  return (
    <View style={{ background: C.white, borderRadius: '24rpx', border: `1rpx solid ${C.border}`, padding: '28rpx 32rpx', marginBottom: '24rpx' }}>
      <Text style={{ fontSize: '32rpx', color: C.dark, fontWeight: '700', marginBottom: '16rpx' }}>{title}</Text>
      {children}
    </View>
  )
}

function FormRow({ label, children, last }: { label: string; children: any; last?: boolean }) {
  return (
    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '22rpx 0', borderBottom: last ? 'none' : `1rpx solid ${C.border}` }}>
      <Text style={{ fontSize: '28rpx', color: C.neutral, flexShrink: 0 }}>{label}</Text>
      {children}
    </View>
  )
}

function FormInput({ label, value, placeholder, onChange, last }: { label: string; value: string; placeholder: string; onChange: (v: string) => void; last?: boolean }) {
  return (
    <FormRow label={label} last={last}>
      <Input value={value} placeholder={placeholder} onInput={e => onChange(e.detail.value)} maxlength={120} style={{ flex: 1, fontSize: '28rpx', color: C.dark, textAlign: 'right' }} />
    </FormRow>
  )
}

function Empty({ text }: { text: string }) {
  return <View style={{ padding: '24rpx', background: C.bg, borderRadius: '18rpx', textAlign: 'center' }}><Text style={{ fontSize: '26rpx', color: C.secondary }}>{text}</Text></View>
}

function statusLabel(status: string) {
  if (status === 'ISSUED') return '已开票'
  if (status === 'REQUESTED') return '待开票'
  return status || '待开票'
}

const center: React.CSSProperties = { minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const itemCard: React.CSSProperties = { padding: '22rpx 0', borderBottom: `1rpx solid ${C.border}` }
const itemTitle: React.CSSProperties = { display: 'block', fontSize: '28rpx', color: C.dark, fontWeight: '600', marginBottom: '8rpx' }
const itemMeta: React.CSSProperties = { display: 'block', fontSize: '24rpx', color: C.neutral, lineHeight: '1.6' }
const itemHint: React.CSSProperties = { display: 'block', fontSize: '24rpx', color: '#8A6D3B', marginTop: '8rpx' }
const primaryBtn = (loading: boolean): React.CSSProperties => ({ marginTop: '24rpx', height: '80rpx', borderRadius: '999rpx', background: loading ? '#E9EAE5' : C.green, display: 'flex', alignItems: 'center', justifyContent: 'center' })
const smallBtn = (enabled: boolean): React.CSSProperties => ({ marginTop: '16rpx', height: '64rpx', borderRadius: '999rpx', background: enabled ? C.green : '#E9EAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' })
