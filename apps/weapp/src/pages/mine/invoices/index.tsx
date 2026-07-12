import { View, Text, Input, Picker, ScrollView } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { API_BASE_URL as API } from '../../../config/api'
import { getStoredToken, getUserId, isLoggedIn, navigateToLoginWithRedirect, userAuthHeader } from '../../../utils/user'

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
  const router = useRouter()
  const [profile, setProfile] = useState<InvoiceProfile>(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const auth = () => {
    const uid = getUserId()
    const token = getStoredToken()
    if (!uid || !token) throw new Error('请先完成登录')
    return { uid, header: userAuthHeader() }
  }

  const load = async () => {
    if (!isLoggedIn()) {
      navigateToLoginWithRedirect({ returnUrl: '/pages/mine/invoices/index', action: 'OPEN_INVOICE' })
      return
    }
    setLoading(true)
    try {
      const { uid, header } = auth()
      const profileRes = await Taro.request({ url: `${API}/users/me/invoice-profile?userId=${uid}`, header }).catch(() => ({ data: null }))
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
      if ((router.params as any)?.returnToOrders === '1') {
        setTimeout(() => Taro.navigateBack(), 700)
      }
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
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

        <View style={{ padding: '0 8rpx' }}>
          <Text style={{ fontSize: '24rpx', color: C.secondary, lineHeight: '1.6' }}>
            开票申请请从“我的订单”中选择对应订单发起。这里仅维护默认开票信息。
          </Text>
        </View>
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

const center: React.CSSProperties = { minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const primaryBtn = (loading: boolean): React.CSSProperties => ({ marginTop: '24rpx', height: '80rpx', borderRadius: '999rpx', background: loading ? '#E9EAE5' : C.green, display: 'flex', alignItems: 'center', justifyContent: 'center' })
