import { View, Text, Image, Input, Picker } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { getUserId, isLoggedIn, logoutUser } from '../../utils/user'

import { API_BASE_URL as API } from '../../config/api'

// ── UI-STANDARD colors ──
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

interface UserProfile {
  id: string; nickname: string | null; avatarUrl: string | null
  gender: string | null; phone: string | null
  birthYearMonth: string | null; identityType: string | null
}

function computeAge(birthYM: string | null): number | null {
  if (!birthYM) return null
  const m = birthYM.match(/^(\d{4})-(\d{2})$/)
  if (!m) return null
  const by = Number(m[1]); const bm = Number(m[2])
  const now = new Date()
  let age = now.getFullYear() - by
  if (now.getMonth() + 1 < bm) age -= 1
  return Math.max(0, age)
}

const GENDER_OPTIONS = ['unknown', '男', '女']
const LABEL_GENDER: Record<string, string> = { unknown: '未设置', '男': '男', '女': '女' }
const GENDER_LIST = ['未设置', '男', '女']

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: currentYear - 1930 + 1 }, (_, i) => String(currentYear - i))
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))

export default function MinePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editing, setEditing] = useState(false)
  const [editNickname, setEditNickname] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [editYear, setEditYear] = useState('')
  const [editMonth, setEditMonth] = useState('')
  const [editGender, setEditGender] = useState(0)
  const [saving, setSaving] = useState(false)

  // ── Load profile ──
  const loadProfile = async () => {
    if (!isLoggedIn()) { setError('请先完成登录'); setLoading(false); return }
    const uid = getUserId()
    setLoading(true); setError('')
    try {
      const res = await Taro.request({ url: `${API}/users/${uid}/profile` })
      setProfile(res.data as UserProfile)
    } catch (e) { console.error('[mine]', e); setError('加载失败') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadProfile() }, [])

  // ── Enter edit mode ──
  const startEdit = () => {
    if (!profile) return
    setEditNickname(profile.nickname || '')
    setEditPhone(profile.phone || '')
    setEditAvatar(profile.avatarUrl || '')
    setEditGender(GENDER_OPTIONS.indexOf(profile.gender || 'unknown'))
    const bm = profile.birthYearMonth
    if (bm && /^\d{4}-\d{2}$/.test(bm)) { const [y, m] = bm.split('-'); setEditYear(y); setEditMonth(m) }
    else { setEditYear(''); setEditMonth('') }
    setEditing(true)
  }

  const cancelEdit = () => setEditing(false)

  const pickAvatar = () => {
    Taro.chooseImage({
      count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'],
      success: (res) => { if (res.tempFilePaths?.length) setEditAvatar(res.tempFilePaths[0]) },
    })
  }

  // ── Save profile ──
  const saveProfile = async () => {
    const uid = getUserId()
    if (!uid || saving) return
    setSaving(true)
    try {
      const body: Record<string, any> = {}
      if (editNickname !== (profile?.nickname || '')) body.nickname = editNickname || null
      if (editPhone !== (profile?.phone || '')) body.phone = editPhone || null
      if (GENDER_OPTIONS[editGender] !== (profile?.gender || 'unknown')) body.gender = GENDER_OPTIONS[editGender]
      const bym = editYear && editMonth ? `${editYear}-${editMonth}` : null
      if (bym !== (profile?.birthYearMonth || null)) body.birthYearMonth = bym
      if (editAvatar !== (profile?.avatarUrl || '')) body.avatarUrl = editAvatar || null

      await Taro.request({ method: 'PATCH', url: `${API}/users/${uid}/profile`, data: body })
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setEditing(false)
      // Re-fetch
      const res = await Taro.request({ url: `${API}/users/${uid}/profile` })
      const p = res.data as UserProfile
      setProfile(p)
      Taro.setStorageSync('xingzhe_user_profile', p)
    } catch (e: any) {
      console.error('[mine]', e)
      Taro.showToast({ title: e?.errMsg || '保存失败', icon: 'none' })
    } finally { setSaving(false) }
  }

  const age = computeAge(profile?.birthYearMonth || null)

  // ── Loading ──
  if (loading) {
    return <View style={fullCenter}><Text style={{ fontSize: '28rpx', color: C.secondary }}>加载中...</Text></View>
  }

  // V2.6B: Login / logout
  const handleLogout = () => {
    setProfile(null)
    setError('')
    setLoading(false)
    logoutUser() // clears storage + reLaunches to login page
  }

  // ── Not logged in (profile null, no error) ──
  if (!profile && !loading) {
    return (
      <View style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48rpx' }}>
        <Text style={{ fontSize: '32rpx', fontWeight: '700', color: C.dark, textAlign: 'center', display: 'block', marginBottom: '8rpx' }}>登录行者学社</Text>
        <Text style={{ fontSize: '26rpx', color: C.neutral, textAlign: 'center', display: 'block', marginBottom: '32rpx' }}>登录后查看你的报名、证书和行者之路</Text>
        <View onClick={() => Taro.reLaunch({ url: '/pages/auth/login/index' })} style={{ padding: '18rpx 56rpx', background: C.green, borderRadius: '999rpx' }}>
          <Text style={{ fontSize: '30rpx', fontWeight: '600', color: '#FFFFFF' }}>去登录</Text>
        </View>
        {error ? <Text style={{ fontSize: '24rpx', color: '#B35B4B', marginTop: '16rpx' }}>{error}</Text> : null}
      </View>
    )
  }

  // ── EDIT MODE ──
  if (editing) {
    const yi = editYear ? YEARS.indexOf(editYear) : 0
    const mi = editMonth ? MONTHS.indexOf(editMonth) : 0

    return (
      <View style={{ minHeight: '100vh', background: C.bg, paddingBottom: '60rpx' }}>
        {/* Top bar: back button left, title center */}
        <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24rpx 24rpx 0' }}>
          <View onClick={cancelEdit} style={{ width: '60rpx', height: '60rpx', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: '36rpx', color: C.dark }}>&lt;</Text>
          </View>
          <Text style={{ fontSize: '32rpx', fontWeight: '700', color: C.dark }}>编辑资料</Text>
          <View style={{ width: '100rpx' }} />
        </View>

        <View style={{ padding: '24rpx 32rpx 0' }}>
          {/* Avatar */}
          <View style={row}>
            <Text style={label}>头像</Text>
            <View onClick={pickAvatar} style={{ display: 'flex', alignItems: 'center', gap: '16rpx' }}>
              <View style={avatarBox}>
                {editAvatar ? <Image src={editAvatar} mode='aspectFill' style={{ width: '100%', height: '100%' }} /> : null}
              </View>
              <Text style={{ fontSize: '24rpx', color: C.neutral }}>点击更换</Text>
            </View>
          </View>

          {/* Nickname */}
          <View style={row}>
            <Text style={label}>昵称</Text>
            <Input value={editNickname} onInput={e => setEditNickname(e.detail.value)} placeholder='输入昵称' maxlength={50} style={inputStyle} />
          </View>

          {/* Gender */}
          <View style={row}>
            <Text style={label}>性别</Text>
            <Picker mode='selector' range={GENDER_LIST} value={editGender} onChange={e => setEditGender(Number(e.detail.value))}>
              <Text style={{ fontSize: '28rpx', color: C.dark }}>{GENDER_LIST[editGender]} ▾</Text>
            </Picker>
          </View>

          {/* Phone */}
          <View style={row}>
            <Text style={label}>手机号</Text>
            <Input value={editPhone} onInput={e => setEditPhone(e.detail.value)} placeholder='输入手机号' maxlength={20} style={inputStyle} />
          </View>

          {/* Birth Year */}
          <View style={row}>
            <Text style={label}>出生年份</Text>
            <Picker mode='selector' range={YEARS} value={yi} onChange={e => setEditYear(YEARS[Number(e.detail.value)])}>
              <Text style={{ fontSize: '28rpx', color: editYear ? C.dark : C.secondary }}>{editYear || '选择年份'} ▾</Text>
            </Picker>
          </View>

          {/* Birth Month */}
          <View style={row}>
            <Text style={label}>出生月份</Text>
            <Picker mode='selector' range={MONTHS} value={mi} onChange={e => setEditMonth(MONTHS[Number(e.detail.value)])}>
              <Text style={{ fontSize: '28rpx', color: editMonth ? C.dark : C.secondary }}>{editMonth ? `${editMonth}月` : '选择月份'} ▾</Text>
            </Picker>
          </View>

          {/* Save button */}
          <View style={{ marginTop: '40rpx' }}>
            <View onClick={saveProfile} style={saveBtn(saving)}>
              <Text style={{ fontSize: '30rpx', fontWeight: '600', color: '#FFFFFF' }}>{saving ? '保存中...' : '保存'}</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  // ── DISPLAY MODE ──
  return (
    <View style={{ minHeight: '100vh', background: C.bg, paddingBottom: '80rpx' }}>
      {/* Avatar + name + edit button */}
      <View style={{ padding: '40rpx 32rpx 24rpx', display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <View style={avatarBox}>
          {profile.avatarUrl ? <Image src={profile.avatarUrl} mode='aspectFill' style={{ width: '100%', height: '100%' }} /> : null}
        </View>
        <View style={{ flex: 1, marginLeft: '24rpx' }}>
          <Text style={{ fontSize: '36rpx', fontWeight: '700', color: C.dark }}>{profile.nickname || '行者'}</Text>
        </View>
        <View onClick={startEdit} style={{ padding: '12rpx 28rpx', borderRadius: '999rpx', border: `1rpx solid ${C.border}`, background: C.white }}>
          <Text style={{ fontSize: '26rpx', color: C.green }}>编辑</Text>
        </View>
      </View>

      {/* Profile info card */}
      <View style={{ margin: '0 32rpx', background: C.white, borderRadius: '24rpx', padding: '28rpx 32rpx', border: `1rpx solid ${C.border}` }}>
        <Row label='昵称' value={profile.nickname} />
        <Row label='性别' value={LABEL_GENDER[profile.gender || 'unknown']} />
        <Row label='手机号' value={profile.phone} />
        <Row label='出生年月' value={profile.birthYearMonth} />
        <Row label='年龄' value={age !== null ? String(age) : null} />
        <Row label='类型' value={profile.identityType} last />
      </View>

      {/* Menu */}
      <View style={{ margin: '24rpx 32rpx 0', background: C.white, borderRadius: '24rpx', border: `1rpx solid ${C.border}`, overflow: 'hidden' }}>
        {/* 我的报名 */}
        <View onClick={() => Taro.navigateTo({ url: '/pages/mine/registrations/index' })} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '28rpx 32rpx', borderBottom: `1rpx solid ${C.border}` }}>
          <Text style={{ fontSize: '28rpx', color: C.dark }}>我的报名</Text>
          <Text style={{ fontSize: '24rpx', color: C.secondary }}>&gt;</Text>
        </View>
        {/* 我的证书 — navigate to cert list page */}
        <View onClick={() => Taro.navigateTo({ url: '/pages/mine/certificates/index' })} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '28rpx 32rpx', borderBottom: `1rpx solid ${C.border}` }}>
          <Text style={{ fontSize: '28rpx', color: C.dark }}>我的证书</Text>
          <Text style={{ fontSize: '24rpx', color: C.secondary }}>&gt;</Text>
        </View>
        {/* 我的订单 — not yet available */}
        <View onClick={() => Taro.showToast({ title: '当前暂无订单', icon: 'none' })} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '28rpx 32rpx', borderBottom: `1rpx solid ${C.border}` }}>
          <Text style={{ fontSize: '28rpx', color: C.dark }}>我的订单</Text>
          <Text style={{ fontSize: '24rpx', color: C.secondary }}>&gt;</Text>
        </View>
        {/* 我的邀请 — not yet available */}
        <View onClick={() => Taro.showToast({ title: '当前暂无邀请记录', icon: 'none' })} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '28rpx 32rpx' }}>
          <Text style={{ fontSize: '28rpx', color: C.dark }}>我的邀请</Text>
          <Text style={{ fontSize: '24rpx', color: C.secondary }}>&gt;</Text>
        </View>
      </View>

      <View style={{ marginTop: '32rpx', padding: '0 32rpx', textAlign: 'center' }}>
        <View onClick={handleLogout} style={{ padding: '14rpx 0', borderRadius: '999rpx', border: `1rpx solid ${C.border}`, background: C.white }}>
          <Text style={{ fontSize: '26rpx', color: '#B35B4B' }}>退出登录</Text>
        </View>
      </View>

      <View style={{ padding: '20rpx 32rpx 40rpx', textAlign: 'center' }}>
        <Text style={{ fontSize: '24rpx', color: C.secondary }}>行者学社 · 把身体从屏幕里带出来</Text>
      </View>
    </View>
  )
}

// ── Reusable components ──

function Row({ label, value, last }: { label: string; value: string | null; last?: boolean }) {
  return (
    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '16rpx 0', borderBottom: last ? 'none' : `1rpx solid ${C.border}` }}>
      <Text style={{ fontSize: '28rpx', color: C.neutral }}>{label}</Text>
      <Text style={{ fontSize: '28rpx', color: value ? C.dark : C.secondary, maxWidth: '360rpx', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value || '未填写'}
      </Text>
    </View>
  )
}

function MenuRow({ label, border }: { label: string; border?: boolean }) {
  return (
    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '28rpx 32rpx', borderBottom: border ? `1rpx solid ${C.border}` : 'none' }}>
      <Text style={{ fontSize: '28rpx', color: C.dark }}>{label}</Text>
      <Text style={{ fontSize: '24rpx', color: C.secondary }}>&gt;</Text>
    </View>
  )
}

// ── Styles ──

const fullCenter: React.CSSProperties = { minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }

const avatarBox: React.CSSProperties = { width: '120rpx', height: '120rpx', borderRadius: '50%', background: C.lightGreen, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }

const row: React.CSSProperties = { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '24rpx 0', borderBottom: `1rpx solid ${C.border}` }

const label: React.CSSProperties = { fontSize: '28rpx', color: C.neutral, flexShrink: 0 }

const inputStyle: React.CSSProperties = { flex: 1, fontSize: '28rpx', color: C.dark, textAlign: 'right' }

const saveBtn = (loading: boolean): React.CSSProperties => ({
  width: '100%', height: '88rpx', borderRadius: '999rpx',
  background: loading ? '#E9EAE5' : C.green, display: 'flex', alignItems: 'center', justifyContent: 'center',
})
