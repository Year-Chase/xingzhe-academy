import { View, Text, Image, Input, Picker, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { usePullDownRefresh, useDidShow } from '@tarojs/taro'
import { getUserId, isLoggedIn, logoutUser, navigateToLoginWithRedirect, saveStoredProfile, updateUserProfile, uploadUserAvatar, userAuthHeader } from '../../utils/user'

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
  gender: string | null; phone?: string | null; phoneMasked?: string | null
  birthday: string | null; birthYearMonth: string | null; identityType: string | null
  intro: string | null
}

function formatBirthDate(profile: UserProfile | null): string {
  if (!profile) return ''
  if (profile.birthday && /^\d{4}-\d{2}-\d{2}$/.test(profile.birthday)) {
    const [y, m, d] = profile.birthday.split('-')
    return `${y}年${m}月${d}日`
  }
  if (profile.birthYearMonth && /^\d{4}-\d{2}$/.test(profile.birthYearMonth)) {
    const [y, m] = profile.birthYearMonth.split('-')
    return `${y}年${m}月未补全`
  }
  return ''
}

function imgUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (/^https?:\/\//.test(path) || path.startsWith('wxfile://') || path.startsWith('http://tmp') || path.startsWith('file://')) return path
  return API + (path.startsWith('/') ? '' : '/') + path
}

function badgeText(count: number): string {
  return count > 99 ? '99+' : String(count)
}

const GENDER_OPTIONS = ['unknown', '男', '女']
const LABEL_GENDER: Record<string, string> = { unknown: '未设置', '男': '男', '女': '女' }
const GENDER_LIST = ['未设置', '男', '女']

const today = new Date().toISOString().slice(0, 10)

export default function MinePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileDetail, setProfileDetail] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [pendingPostpayCount, setPendingPostpayCount] = useState(0)
  const [pendingCheckinCount, setPendingCheckinCount] = useState(0)
  const [editing, setEditing] = useState(false)
  const [editNickname, setEditNickname] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [editAvatarTemp, setEditAvatarTemp] = useState('')
  const [editBirthday, setEditBirthday] = useState('')
  const [editGender, setEditGender] = useState(0)
  const [editIntro, setEditIntro] = useState('')
  const [saving, setSaving] = useState(false)
  const [showEditAvatarSheet, setShowEditAvatarSheet] = useState(false)

  // ── Load profile ──
  const loadProfile = async () => {
    if (!isLoggedIn()) { setError('请先完成登录'); setLoading(false); return }
    const uid = getUserId()
    setLoading(true); setError('')
    try {
      const [profileRes, postpayRes] = await Promise.all([
        Taro.request({ url: `${API}/users/${uid}/profile` }),
        Taro.request({ url: `${API}/orders/my-postpay?userId=${uid}` }).catch(() => ({ data: [] })),
      ])
      const registrationsRes = await Taro.request({
        url: `${API}/users/me/registrations?userId=${uid}`,
        header: userAuthHeader(),
      }).catch(() => ({ data: { items: [], pendingCheckinCount: 0 } }))
      setProfile(profileRes.data as UserProfile)
      setProfileDetail(null)
      const orders = (postpayRes.data || []) as any[]
      setPendingPostpayCount(orders.filter((o: any) => o.postpayStatus === 'UNPAID' || o.postpayStatus === 'OVERDUE').length)
      const regData = registrationsRes.data as any
      if (typeof regData?.pendingCheckinCount === 'number') {
        setPendingCheckinCount(regData.pendingCheckinCount)
      } else {
        const items = (regData?.items || []) as any[]
        setPendingCheckinCount(items.filter(item => item.registrationStatus === 'PAID' && item.checkinStatus !== 'CHECKED_IN' && !item.isCompleted).length)
      }
    } catch (_e) { console.error('[mine] load failed'); setError('加载失败') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadProfile() }, [])
  usePullDownRefresh(() => { loadProfile().then(() => Taro.stopPullDownRefresh()) })
  useDidShow(() => { loadProfile() })

  // ── Enter edit mode ──
  const startEdit = async () => {
    if (!profile) return
    const uid = getUserId()
    try {
      const res = await Taro.request({
        url: `${API}/users/${uid}/profile`,
        header: userAuthHeader(),
      })
      if (res.statusCode < 200 || res.statusCode >= 300) {
        throw new Error((res.data as any)?.message || '读取资料失败')
      }
      const detail = res.data as UserProfile
      setProfileDetail(detail)
      setEditNickname(detail.nickname || '')
      setEditPhone(detail.phone || '')
      setEditAvatar(detail.avatarUrl || '')
      setEditAvatarTemp('')
      setEditGender(GENDER_OPTIONS.indexOf(detail.gender || 'unknown'))
      setEditIntro(detail.intro || '')
      setEditBirthday(detail.birthday && /^\d{4}-\d{2}-\d{2}$/.test(detail.birthday) ? detail.birthday : '')
      setEditing(true)
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '读取资料失败', icon: 'none' })
    }
  }

  const cancelEdit = () => setEditing(false)

  const handleChooseAvatar = (e: any) => {
    const avatarUrl = e?.detail?.avatarUrl
    if (avatarUrl) {
      setEditAvatar(avatarUrl)
      setEditAvatarTemp(avatarUrl)
      setShowEditAvatarSheet(false)
    }
  }

  const chooseEditAvatarImage = async (sourceType: 'album' | 'camera') => {
    try {
      const res = await Taro.chooseImage({ count: 1, sourceType: [sourceType] })
      const path = res.tempFilePaths?.[0]
      if (path) {
        setEditAvatar(path)
        setEditAvatarTemp(path)
      }
    } catch (e) {
      // Cancel is a normal path here.
    } finally {
      setShowEditAvatarSheet(false)
    }
  }

  // ── Save profile ──
  const saveProfile = async () => {
    const uid = getUserId()
    if (!uid || saving) return
    const baseProfile = profileDetail || profile
    setSaving(true)
    try {
      const body: Record<string, any> = {}
      if (editNickname !== (baseProfile?.nickname || '')) body.nickname = editNickname || null
      if (editPhone !== (baseProfile?.phone || '')) body.phone = editPhone || null
      if (GENDER_OPTIONS[editGender] !== (baseProfile?.gender || 'unknown')) body.gender = GENDER_OPTIONS[editGender]
      const birthday = editBirthday || null
      if (birthday !== (baseProfile?.birthday || null)) {
        body.birthday = birthday
        body.birthYearMonth = birthday ? birthday.slice(0, 7) : null
      }
      if (editAvatar !== (baseProfile?.avatarUrl || '')) {
        body.avatarUrl = editAvatarTemp ? await uploadUserAvatar(editAvatarTemp) : (editAvatar || null)
      }
      if (editIntro !== (baseProfile?.intro || '')) body.intro = editIntro || null

      const updatedDetail = await updateUserProfile(body)
      setProfileDetail(updatedDetail as UserProfile)
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setEditing(false)
      // Re-fetch
      const res = await Taro.request({ url: `${API}/users/${uid}/profile` })
      const p = res.data as UserProfile
      setProfile(p)
      saveStoredProfile(p)
    } catch (e: any) {
      console.error('[mine] save failed')
      Taro.showToast({ title: e?.message || e?.errMsg || '保存失败', icon: 'none' })
    } finally { setSaving(false) }
  }

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
        <View onClick={() => navigateToLoginWithRedirect({ returnUrl: '/pages/mine/index' })} style={{ padding: '18rpx 56rpx', background: C.green, borderRadius: '999rpx' }}>
          <Text style={{ fontSize: '30rpx', fontWeight: '600', color: '#FFFFFF' }}>去登录</Text>
        </View>
        {error ? <Text style={{ fontSize: '24rpx', color: '#B35B4B', marginTop: '16rpx' }}>{error}</Text> : null}
      </View>
    )
  }

  // ── EDIT MODE ──
  if (editing) {
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
            <View style={{ display: 'flex', alignItems: 'center', gap: '16rpx' }}>
              <View onClick={() => setShowEditAvatarSheet(true)} style={avatarBox}>
                {editAvatar ? <Image src={imgUrl(editAvatar)} mode='aspectFill' style={{ width: '100%', height: '100%' }} /> : null}
              </View>
              <Text style={{ fontSize: '24rpx', color: C.secondary }}>点击头像选择</Text>
            </View>
          </View>

          {/* Nickname */}
          <View style={row}>
            <Text style={label}>昵称</Text>
            <Input value={editNickname} onInput={e => setEditNickname(e.detail.value)} placeholder='输入昵称' maxlength={50} style={inputStyle} />
          </View>

          {/* Intro */}
          <View style={{ ...row, alignItems: 'flex-start' }}>
            <Text style={{ ...label, paddingTop: '4rpx' }}>简介</Text>
            <Input value={editIntro} onInput={e => setEditIntro(e.detail.value)} placeholder='介绍一下你自己，让同行者更好地认识你' maxlength={150} style={{ ...inputStyle, minHeight: '60rpx' }} />
          </View>

          {/* Gender */}
          <View style={row}>
            <Text style={label}>性别</Text>
            <Picker mode='selector' range={GENDER_LIST} value={editGender} onChange={e => setEditGender(Number(e.detail.value))}>
              <Text style={{ fontSize: '28rpx', color: C.dark }}>{GENDER_LIST[editGender]} ▾</Text>
            </Picker>
          </View>

          {/* Birth date — one line */}
          <View style={row}>
            <Text style={label}>出生日期</Text>
            <Picker mode='date' value={editBirthday || '1990-01-01'} start='1930-01-01' end={today} onChange={e => setEditBirthday(String(e.detail.value))}>
              <Text style={{ fontSize: '28rpx', color: editBirthday ? C.dark : C.secondary }}>{editBirthday ? formatBirthDate({ ...(profile as UserProfile), birthday: editBirthday }) : '请选择'} ▾</Text>
            </Picker>
          </View>

          {/* Phone */}
          <View style={row}>
            <Text style={label}>手机号</Text>
            <Input value={editPhone} onInput={e => setEditPhone(e.detail.value)} placeholder='输入手机号' maxlength={20} style={inputStyle} />
          </View>

          {/* Save button */}
          <View style={{ marginTop: '40rpx' }}>
            <View onClick={saveProfile} style={saveBtn(saving)}>
              <Text style={{ fontSize: '30rpx', fontWeight: '600', color: '#FFFFFF' }}>{saving ? '保存中...' : '保存'}</Text>
            </View>
          </View>
        </View>

        {showEditAvatarSheet && (
          <View style={{ position: 'fixed', left: 0, right: 0, top: 0, bottom: 0, background: 'rgba(0,0,0,0.28)', zIndex: 30, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowEditAvatarSheet(false)}>
            <View style={{ width: '100%', background: C.white, borderRadius: '28rpx 28rpx 0 0', padding: '18rpx 32rpx calc(24rpx + env(safe-area-inset-bottom))' }} onClick={(e) => e.stopPropagation()}>
              <Button openType='chooseAvatar' onChooseAvatar={handleChooseAvatar} style={sheetButton}>使用微信头像</Button>
              <View onClick={() => chooseEditAvatarImage('album')} style={sheetRow}><Text style={sheetText}>从相册选择</Text></View>
              <View onClick={() => chooseEditAvatarImage('camera')} style={sheetRow}><Text style={sheetText}>拍照</Text></View>
              <View onClick={() => setShowEditAvatarSheet(false)} style={{ ...sheetRow, marginTop: '12rpx', borderTop: `1rpx solid ${C.border}` }}><Text style={{ ...sheetText, color: C.neutral }}>取消</Text></View>
            </View>
          </View>
        )}
      </View>
    )
  }

  // ── DISPLAY MODE ──
  return (
    <View style={{ minHeight: '100vh', background: C.bg, paddingBottom: '80rpx' }}>
      {/* Avatar + name + edit button */}
      <View style={{ padding: '40rpx 32rpx 24rpx', display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      <View style={avatarBox}>
          {profile.avatarUrl ? <Image src={imgUrl(profile.avatarUrl)} mode='aspectFill' style={{ width: '100%', height: '100%' }} /> : null}
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
        <Row label='简介' value={profile.intro} />
        <Row label='性别' value={LABEL_GENDER[profile.gender || 'unknown']} />
        <Row label='手机号' value={profile.phoneMasked || null} />
        <Row label='类型' value={profile.identityType} last />
      </View>

      {/* Menu */}
      <View style={{ margin: '24rpx 32rpx 0', background: C.white, borderRadius: '24rpx', border: `1rpx solid ${C.border}`, overflow: 'hidden' }}>
        {/* 我的报名 */}
        <View onClick={() => Taro.navigateTo({ url: '/pages/mine/registrations/index' })} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '28rpx 32rpx', borderBottom: `1rpx solid ${C.border}` }}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12rpx' }}>
            <Text style={{ fontSize: '28rpx', color: C.dark }}>我的报名</Text>
            {pendingCheckinCount > 0 && (
              <View style={menuBadge}>
                <Text style={menuBadgeText}>{badgeText(pendingCheckinCount)}</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: '24rpx', color: C.secondary }}>&gt;</Text>
        </View>
        {/* 我的订单 */}
        <View onClick={() => Taro.navigateTo({ url: '/pages/mine/orders/index' })} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '28rpx 32rpx', borderBottom: `1rpx solid ${C.border}` }}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12rpx' }}>
            <Text style={{ fontSize: '28rpx', color: C.dark }}>我的订单</Text>
            {pendingPostpayCount > 0 && (
              <View style={menuBadge}>
                <Text style={menuBadgeText}>{badgeText(pendingPostpayCount)}</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: '24rpx', color: C.secondary }}>&gt;</Text>
        </View>
        {/* 我的证书 — navigate to cert list page */}
        <View onClick={() => Taro.navigateTo({ url: '/pages/mine/certificates/index' })} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '28rpx 32rpx', borderBottom: `1rpx solid ${C.border}` }}>
          <Text style={{ fontSize: '28rpx', color: C.dark }}>我的证书</Text>
          <Text style={{ fontSize: '24rpx', color: C.secondary }}>&gt;</Text>
        </View>
        <View onClick={() => Taro.navigateTo({ url: '/pages/mine/invoices/index' })} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '28rpx 32rpx', borderBottom: `1rpx solid ${C.border}` }}>
          <Text style={{ fontSize: '28rpx', color: C.dark }}>发票管理</Text>
          <Text style={{ fontSize: '24rpx', color: C.secondary }}>&gt;</Text>
        </View>
{/* 我的邀请 — temporarily hidden (V2.7.1) */}
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

const menuBadge: React.CSSProperties = { minWidth: '34rpx', height: '32rpx', borderRadius: '999rpx', background: C.lightGreen, border: `1rpx solid rgba(63,107,79,0.14)`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8rpx' }
const menuBadgeText: React.CSSProperties = { fontSize: '20rpx', color: C.green, fontWeight: '600' }

const row: React.CSSProperties = { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '24rpx 0', borderBottom: `1rpx solid ${C.border}` }

const label: React.CSSProperties = { fontSize: '28rpx', color: C.neutral, flexShrink: 0 }

const inputStyle: React.CSSProperties = { flex: 1, fontSize: '28rpx', color: C.dark, textAlign: 'right' }

const saveBtn = (loading: boolean): React.CSSProperties => ({
  width: '100%', height: '88rpx', borderRadius: '999rpx',
  background: loading ? '#E9EAE5' : C.green, display: 'flex', alignItems: 'center', justifyContent: 'center',
})

const sheetRow: React.CSSProperties = { height: '88rpx', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1rpx solid ${C.border}` }
const sheetText: React.CSSProperties = { fontSize: '30rpx', color: C.dark }
const sheetButton: React.CSSProperties = {
  margin: 0,
  height: '88rpx',
  lineHeight: '88rpx',
  background: C.white,
  color: C.dark,
  fontSize: '30rpx',
  border: 'none',
  borderRadius: 0,
  borderBottom: `1rpx solid ${C.border}`,
}
