import { View, Text, Button, ScrollView, Image } from '@tarojs/components'
import { useState, useEffect, useCallback } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { getUserId, isLoggedIn } from '../../../utils/user'
import { canOpenActivityLocation, openActivityLocation } from '../../../utils/location'

import { API_BASE_URL as API } from '../../../config/api'

function ImgWithFallback({ src, style, mode = 'aspectFill' }: { src: string; style: React.CSSProperties; mode?: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return null
  return <Image src={src} mode={mode as any} style={style} onError={() => setFailed(true)} />
}

function imgUrl(cover: string | undefined): string {
  if (!cover) return ''
  if (cover.startsWith('http')) return cover
  return API + (cover.startsWith('/') ? '' : '/') + cover
}

function safeFields(raw: any): string[] {
  if (Array.isArray(raw)) return raw
  if (!raw) return []
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v : [] } catch (e) { console.error('[activity-detail] parse error', e); return [] }
}

interface ActivityData {
  id: number; title: string; description: string; location: string
  locationName?: string; locationAddress?: string; locationLat?: number; locationLng?: number
  startTime: string; endTime: string; capacity: number; registeredCount: number
  coverImage: string; status: string; effectivePrice: number; effectivePriceLabel: string
  requiredUserInfoFields?: any; hasGroupQr?: boolean
  groupQrType?: string; groupQrImageUrl?: string; groupQrTitle?: string; groupQrDescription?: string
  registrationStartTime?: string; registrationEndTime?: string
  memoryImages?: any; memoryText?: string
  createdAt: string
}

interface Participant {
  userId: string; avatarUrl: string; nickname: string; name: string
  gender: string; commonActivityCount: number; motto: string; status: string
}

type RegStatus = 'NOT_REGISTERED' | 'REGISTERED' | 'PAID' | 'CHECKED_IN' | 'EXPIRED'

const C = {
  bg: '#F7F6F2', white: '#FFFFFF', green: '#3F6B4F', dark: '#18231E',
  body: '#3E463F', neutral: '#7A8178', secondary: '#A6AAA2',
  lightGreen: '#EEF5EF', border: '#EDE9DF', disabledBg: '#E9EAE5', disabledText: '#8A9288',
}

const STATUS_LABEL: Record<RegStatus, string> = {
  NOT_REGISTERED: '可报名', REGISTERED: '待支付', PAID: '已报名', CHECKED_IN: '已签到', EXPIRED: '已过期',
}

const PLACEHOLDER_BG = 'linear-gradient(160deg, #DCE6E2 0%, #BED5C5 30%, #9AB8A8 65%, #789A85 100%)'
const GENDER_ICON: Record<string, string> = { '男': '♂', '女': '♀' }

export default function ActivityDetail() {
  const router = useRouter()
  const [id, setId] = useState(0)
  const [activity, setActivity] = useState<ActivityData | null>(null)
  const [userStatus, setUserStatus] = useState<RegStatus>('NOT_REGISTERED')
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [modalUser, setModalUser] = useState<Participant | null>(null)
  const [showPayConfirm, setShowPayConfirm] = useState(false)
  // V2.5C: group QR display
  const [showGroupQr, setShowGroupQr] = useState(false)
  const [groupQrFailed, setGroupQrFailed] = useState(false)

  useEffect(() => { const p = router.params as any; if (p.id) setId(Number(p.id)) }, [router.params])
  useEffect(() => { if (id === 0) return; load(id) }, [id])
  // V2.5C: check enrollSuccess to show group QR
  useEffect(() => {
    const p = router.params as any
    if (p?.enrollSuccess === '1') setShowGroupQr(true)
  }, [router.params])

  const load = useCallback(async (activityId: number) => {
    setLoading(true); setError('')
    try {
      const uid = getUserId()
      const [d, s, p] = await Promise.all([
        Taro.request({ url: `${API}/activity/${activityId}` }),
        Taro.request({ url: `${API}/activity/${activityId}/status?userId=${uid}` }),
        Taro.request({ url: `${API}/activity/${activityId}/participants?userId=${uid}` }).catch(() => ({ data: [] })),
      ])
      setActivity(d.data as ActivityData)
      setUserStatus((s.data as any).status || 'NOT_REGISTERED')
      setParticipants((p.data as Participant[]) || [])
    } catch (e) { console.error('[activity-detail] load', e); setError('加载失败，请下拉重试') }
    finally { setLoading(false) }
  }, [])

  const handleEnroll = async () => {
    if (!isLoggedIn()) {
      Taro.reLaunch({ url: '/pages/auth/login/index' })
      return
    }
    const cap = activity?.capacity ?? 0
    const reg = activity?.registeredCount ?? 0
    if (cap > 0 && reg >= cap) { Taro.showToast({ title: '活动名额已满', icon: 'none' }); return }

    // V2.5C: check requiredUserInfoFields
    const requiredFields = safeFields(activity?.requiredUserInfoFields)
    if (requiredFields.length > 0) {
      Taro.navigateTo({ url: `/pages/activity/registration-info/index?activityId=${id}` })
      return
    }

    // No required fields — use existing flow
    setShowPayConfirm(true)
  }

  const confirmPay = async () => {
    setShowPayConfirm(false)
    if (acting) return; setActing(true)
    try {
      const uid = getUserId()
      const res = await Taro.request({
        method: 'POST',
        url: `${API}/activity/${id}/enroll-pay?userId=${uid}`,
        header: { 'content-type': 'application/json' },
      })
      if ((res.data as any)?.status === 'PAID') {
        Taro.showToast({ title: '报名成功', icon: 'success' })
        Taro.setStorageSync('dirtyActivityId', id)
        setShowGroupQr(true)
        await load(id)
      } else if ((res.data as any)?.message) {
        Taro.showToast({ title: (res.data as any).message, icon: 'none' })
      }
    } catch (e) { console.error('[activity-detail] pay', e); Taro.showToast({ title: '操作失败，请重试', icon: 'none' }) }
    finally { setActing(false) }
  }

  const cancelPay = () => { setShowPayConfirm(false) }
  const goQR = () => {
    Taro.navigateTo({ url: `/pages/activity/qr/index?activityId=${id}&title=${encodeURIComponent(activity?.title || '')}` })
  }

  const fmtDate = (d: string) => { if (!d) return ''; const dt = new Date(d); const w = ['日', '一', '二', '三', '四', '五', '六'][dt.getDay()]; return `${dt.getMonth() + 1}月${dt.getDate()}日（周${w}）` }
  const fmtTimeOnly = (s: string | null | undefined) => { if (!s) return ''; const d = new Date(s); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
  const fmtTimeRange = (s: string | null | undefined, e: string | null | undefined) => {
    const st = fmtDate(s || ''); const so = fmtTimeOnly(s)
    if (!s) return '—'
    if (!e) return `${st} ${so}`
    const et = fmtDate(e); const eo = fmtTimeOnly(e)
    if (st === et) return `${st} ${so} - ${eo}`
    return `${st} ${so} - ${et} ${eo}`
  }

  const reg = activity?.registeredCount ?? 0
  const cap = activity?.capacity ?? 0
  const isSelf = (p: Participant) => p.userId === getUserId()
  const aAny = (activity || {}) as any
  // V2.5.1: activity finished check
  const isFinished = activity ? (activity.endTime ? new Date(activity.endTime).getTime() < Date.now() : false) : false
  const memoryImagesArr = safeFields(aAny.memoryImages).filter(
    (v) => typeof v === 'string' && v.trim().length > 0
  )
  const memoryText = typeof aAny.memoryText === 'string' ? aAny.memoryText.trim() : ''
  const hasMemory = isFinished && (memoryImagesArr.length > 0 || memoryText.length > 0)
  const hasGroupQr = activity?.hasGroupQr && activity?.groupQrImageUrl
  const isPaid = userStatus === 'PAID' || userStatus === 'CHECKED_IN'

  // V2.5.1: toast helper for disabled actions
  const toastFinished = () => Taro.showToast({ title: '活动已结束', icon: 'none' })
  const handleGoQR = () => { if (isFinished) { toastFinished(); return }; goQR() }
  const handleGroupQr = () => { if (isFinished) { toastFinished(); return }; setShowGroupQr(true) }

  if (loading) return <View style={{ padding: '120rpx 32rpx', textAlign: 'center', minHeight: '100vh', background: C.bg }}><Text style={{ color: C.secondary, fontSize: '28rpx' }}>加载中...</Text></View>
  if (error || !activity) return <View style={{ padding: '160rpx 32rpx', textAlign: 'center', minHeight: '100vh', background: C.bg }}><Text style={{ display: 'block', fontSize: '32rpx', color: C.body, marginBottom: '20rpx' }}>{error || '活动未找到'}</Text><Button onClick={() => load(id)} style={{ height: '88rpx', borderRadius: '999rpx', background: C.green, color: '#FFFFFF', fontSize: '30rpx', lineHeight: '88rpx', border: 'none', padding: '0 56rpx' }}>重试</Button></View>

  return (
    <View style={{ minHeight: '100vh', background: C.bg, paddingBottom: '260rpx' }}>

      {/* 1. Title + status pill */}
      <View style={{ margin: '0 32rpx', padding: '32rpx 0 24rpx' }}>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
          <Text style={{ flex: 1, fontSize: '40rpx', fontWeight: '700', color: C.dark, lineHeight: '1.25' }}>{activity.title}</Text>
          <View style={{ flexShrink: 0, marginLeft: '16rpx', marginTop: '6rpx', padding: '6rpx 16rpx', borderRadius: '999rpx', background: C.lightGreen }}>
            <Text style={{ fontSize: '22rpx', color: C.green, fontWeight: '500' }}>{STATUS_LABEL[userStatus]}</Text>
          </View>
        </View>
      </View>

      {/* 2. Cover — 3:2 ratio */}
      <View style={{ margin: '0 32rpx', height: '460rpx', borderRadius: '16rpx', overflow: 'hidden', background: PLACEHOLDER_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {activity.coverImage ? (
          <ImgWithFallback src={imgUrl(activity.coverImage)} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Text style={{ fontSize: '72rpx', color: 'rgba(24,35,30,0.15)' }}>行者学社</Text>
        )}
      </View>

      {/* 3. Info card */}
      <View style={{ margin: '24rpx 32rpx 0', background: C.white, borderRadius: '24rpx', padding: '28rpx 32rpx', border: '1rpx solid #EDE9DF', boxShadow: '0 8rpx 24rpx rgba(24,35,30,0.06)' }}>
        {(aAny.registrationStartTime || aAny.registrationEndTime) && (
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', paddingBottom: '18rpx', marginBottom: '18rpx', borderBottom: '1rpx solid #EDE9DF' }}>
            <Text style={{ width: '140rpx', flexShrink: 0, fontSize: '26rpx', color: C.neutral }}>报名时间</Text>
            <Text style={{ flex: 1, fontSize: '26rpx', color: C.body, lineHeight: '1.5' }}>{fmtTimeRange(aAny.registrationStartTime, aAny.registrationEndTime)}</Text>
          </View>
        )}
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', paddingBottom: '18rpx', marginBottom: '18rpx', borderBottom: '1rpx solid #EDE9DF' }}>
          <Text style={{ width: '140rpx', flexShrink: 0, fontSize: '26rpx', color: C.neutral }}>活动时间</Text>
          <Text style={{ flex: 1, fontSize: '26rpx', color: C.body, lineHeight: '1.5' }}>{fmtTimeRange(activity.startTime, activity.endTime)}</Text>
        </View>
        {/* V2.6E: Location card — full row clickable, icon replaces '导航' text */}
        <View onClick={() => { if (canOpenActivityLocation(activity)) openActivityLocation(activity); else Taro.showToast({ title: '暂无可导航定位', icon: 'none' }) }}
          style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', paddingBottom: '18rpx', marginBottom: '18rpx', borderBottom: '1rpx solid #EDE9DF' }}>
          <Text style={{ width: '140rpx', flexShrink: 0, fontSize: '26rpx', color: C.neutral }}>地点</Text>
          <Text style={{ flex: 1, fontSize: '26rpx', color: C.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {(activity as any).locationName || activity.location || '活动地点待确认'}
          </Text>
          <Text style={{ flexShrink: 0, fontSize: '32rpx', color: C.green, marginLeft: '12rpx' }}>↗</Text>
        </View>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', paddingBottom: '18rpx', marginBottom: '18rpx', borderBottom: '1rpx solid #EDE9DF' }}>
          <Text style={{ width: '140rpx', flexShrink: 0, fontSize: '26rpx', color: C.neutral }}>名额</Text>
          <Text style={{ fontSize: '26rpx', color: C.body }}><Text style={{ fontWeight: '700', color: C.dark }}>{reg}</Text><Text style={{ color: C.secondary }}> / {cap} 人已报名</Text></Text>
        </View>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ width: '140rpx', flexShrink: 0, fontSize: '26rpx', color: C.neutral }}>价格</Text>
          <Text style={{ fontSize: '26rpx', color: C.body }}>
            {activity.effectivePrice > 0 ? (
              <Text>{activity.effectivePriceLabel || '普通价'} <Text style={{ fontWeight: '700', color: C.dark }}>¥{activity.effectivePrice}</Text></Text>
            ) : (
              <Text style={{ color: '#2E7D5A', fontWeight: '600' }}>免费</Text>
            )}
          </Text>
        </View>
      </View>

      {/* 4. 活动介绍 */}
      {activity.description ? (
        <View style={{ margin: '24rpx 32rpx 0', background: C.white, borderRadius: '24rpx', padding: '30rpx 32rpx', border: '1rpx solid #EDE9DF', boxShadow: '0 8rpx 24rpx rgba(24,35,30,0.05)' }}>
          <Text style={{ fontSize: '32rpx', fontWeight: '700', color: C.dark, display: 'block', marginBottom: '20rpx' }}>活动介绍</Text>
          <Text style={{ fontSize: '27rpx', color: C.body, lineHeight: '1.65' }}>{activity.description}</Text>
        </View>
      ) : null}

      {/* V2.5C: Group QR for paid users — only button, opens popup */}
      {isPaid && hasGroupQr && (
        <View style={{ margin: '24rpx 32rpx 0', background: C.white, borderRadius: '24rpx', padding: '20rpx 28rpx', border: '1rpx solid #EDE9DF', boxShadow: '0 8rpx 24rpx rgba(24,35,30,0.05)', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: isFinished ? 0.5 : 1 }}>
          <View>
            <Text style={{ fontSize: '28rpx', fontWeight: '600', color: isFinished ? C.disabledText : C.dark, display: 'block' }}>{activity.groupQrTitle || '加入活动群'}{isFinished ? '（活动已结束）' : ''}</Text>
            <Text style={{ fontSize: '23rpx', color: C.neutral, display: 'block', marginTop: '4rpx' }}>{activity.groupQrDescription || '活动通知、集合安排和现场事项将在群内同步'}</Text>
          </View>
          <Button onClick={handleGroupQr} disabled={isFinished}
            style={{ flexShrink: 0, marginLeft: '16rpx', height: '60rpx', borderRadius: '999rpx', background: isFinished ? C.disabledBg : C.lightGreen, border: `1rpx solid ${C.border}`, color: isFinished ? C.disabledText : C.green, fontSize: '26rpx', lineHeight: '60rpx', padding: '0 24rpx' }}
          >查看</Button>
        </View>
      )}

      {/* V2.5.1: Memory module for finished activities */}
      {isFinished && hasMemory && (
        <View style={{ margin: '24rpx 32rpx 0', background: C.white, borderRadius: '24rpx', padding: '28rpx 32rpx', border: '1rpx solid #EDE9DF', boxShadow: '0 8rpx 24rpx rgba(24,35,30,0.05)' }}>
          <Text style={{ fontSize: '30rpx', fontWeight: '700', color: C.dark, display: 'block', marginBottom: '6rpx' }}>活动回忆</Text>
          <Text style={{ fontSize: '23rpx', color: C.neutral, display: 'block', marginBottom: '16rpx' }}>那些走过的路，都会成为你的行者印记。</Text>
          {memoryText ? <Text style={{ fontSize: '26rpx', color: C.body, lineHeight: '1.65', display: 'block', marginBottom: '16rpx' }}>{memoryText}</Text> : null}
          {memoryImagesArr.length > 0 && (
            <ScrollView scrollX style={{ whiteSpace: 'nowrap' }}>
              <View style={{ display: 'flex', flexDirection: 'row', gap: '12rpx' }}>
                {memoryImagesArr.map((img: string, i: number) => (
                  <ImgWithFallback key={i} src={img.startsWith('http') ? img : `${API}${img.startsWith('/') ? '' : '/'}${img}`} mode='aspectFill' style={{ width: '200rpx', height: '160rpx', borderRadius: '12rpx', flexShrink: 0 }} />
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      )}

      {/* 理念提示卡 */}
      <View style={{ margin: '24rpx 32rpx 0', padding: '24rpx', background: C.lightGreen, borderRadius: '18rpx', border: '1rpx solid rgba(46,125,90,0.12)' }}>
        <Text style={{ fontSize: '28rpx', fontWeight: '700', color: C.green, display: 'block', lineHeight: '1.5' }}>这不是一次打卡式活动。</Text>
        <Text style={{ fontSize: '25rpx', color: C.neutral, display: 'block', marginTop: '8rpx', lineHeight: '1.5' }}>我们会用一段真实的时间，把身体从屏幕里带出来。</Text>
      </View>

      {/* 报名须知 */}
      <View style={{ margin: '22rpx 32rpx 0', padding: '24rpx', background: C.white, borderRadius: '18rpx', border: '1rpx solid #EDE9DF', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: '26rpx', color: C.neutral }}>适合人群 · 注意事项 · 报名须知</Text>
        <Text style={{ fontSize: '24rpx', color: C.secondary }}>→</Text>
      </View>

      {/* 已报名行者 */}
      <View style={{ margin: '24rpx 32rpx 0' }}>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12rpx' }}>
          <Text style={{ fontSize: '32rpx', fontWeight: '700', color: C.dark }}>已报名行者</Text>
          <Text style={{ fontSize: '24rpx', color: C.secondary }}>{participants.length} 人报名</Text>
        </View>
        <View style={{ background: C.white, borderRadius: '24rpx', padding: '24rpx', border: '1rpx solid #EDE9DF', boxShadow: '0 8rpx 24rpx rgba(24,35,30,0.05)' }}>
          {participants.length === 0 ? (
            <View style={{ padding: '28rpx', background: C.bg, borderRadius: '18rpx', textAlign: 'center' }}>
              <Text style={{ fontSize: '26rpx', color: C.secondary }}>还没有行者报名，成为第一个出发的人。</Text>
            </View>
          ) : (
            <ScrollView scrollX style={{ whiteSpace: 'nowrap' }}>
              <View style={{ display: 'flex', flexDirection: 'row', gap: '20rpx' }}>
                {participants.map((p, i) => {
                  const self = isSelf(p)
                  return (
                    <View key={i} onClick={() => setModalUser(p)} style={{ width: '96rpx', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <View style={{ width: '72rpx', height: '72rpx', borderRadius: '50%', background: self ? '#D9EADD' : C.lightGreen, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <Text style={{ fontSize: '32rpx' }}>👤</Text>
                      </View>
                      <Text style={{ fontSize: '22rpx', color: C.body, marginTop: '10rpx', maxWidth: '88rpx', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
                        {p.nickname}{self ? '（我）' : ''}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {/* Modal: participant detail */}
      {modalUser && (
        <View style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setModalUser(null)}>
          <View style={{ width: '620rpx', maxWidth: 'calc(100vw - 96rpx)', background: C.white, borderRadius: '28rpx', padding: '40rpx 36rpx', boxShadow: '0 16rpx 48rpx rgba(0,0,0,0.16)' }} onClick={(e) => e.stopPropagation()}>
            <View style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <View onClick={() => setModalUser(null)} style={{ width: '48rpx', height: '48rpx', borderRadius: '50%', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: '30rpx', color: C.neutral }}>×</Text>
              </View>
            </View>
            <View style={{ display: 'flex', justifyContent: 'center', marginTop: '12rpx' }}>
              <View style={{ width: '128rpx', height: '128rpx', borderRadius: '50%', background: C.lightGreen, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: '56rpx' }}>👤</Text>
              </View>
            </View>
            <Text style={{ fontSize: '34rpx', fontWeight: '700', color: C.dark, textAlign: 'center', marginTop: '24rpx' }}>
              {modalUser.nickname || '行者'}{isSelf(modalUser) ? '（我）' : ''}
              {modalUser.gender !== '未知' && <Text style={{ fontSize: '26rpx', color: C.green, marginLeft: '8rpx' }}>{GENDER_ICON[modalUser.gender] || ''}</Text>}
            </Text>
            {!isSelf(modalUser) && (
              <Text style={{ fontSize: '26rpx', color: C.green, textAlign: 'center', marginTop: '14rpx' }}>共同参加 {modalUser.commonActivityCount} 场活动</Text>
            )}
            {modalUser.motto ? (
              <View style={{ background: '#FBFAF6', border: '1rpx solid #EDE9DF', borderRadius: '18rpx', padding: '24rpx', marginTop: '28rpx' }}>
                <Text style={{ fontSize: '26rpx', color: C.body, lineHeight: '1.6' }}>"{modalUser.motto}"</Text>
              </View>
            ) : null}
          </View>
        </View>
      )}

      {/* Modal: mock 支付确认 (V2.5C: shows regInfo if present) */}
      {showPayConfirm && (
        <View style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={cancelPay}>
          <View style={{ width: '560rpx', background: C.white, borderRadius: '24rpx', padding: '40rpx 36rpx 32rpx', boxShadow: '0 16rpx 48rpx rgba(0,0,0,0.16)' }} onClick={(e) => e.stopPropagation()}>
            <Text style={{ fontSize: '32rpx', fontWeight: '700', color: C.dark, textAlign: 'center', display: 'block' }}>确认报名并支付？</Text>
            <Text style={{ fontSize: '26rpx', color: C.neutral, textAlign: 'center', display: 'block', marginTop: '12rpx' }}>{activity?.title || ''}</Text>
            <View style={{ display: 'flex', flexDirection: 'row', gap: '20rpx', marginTop: '36rpx' }}>
              <Button onClick={cancelPay} style={{ flex: 1, height: '88rpx', borderRadius: '999rpx', background: C.white, border: '1rpx solid #EDE9DF', color: C.neutral, fontSize: '30rpx', lineHeight: '88rpx', textAlign: 'center' }}>取消</Button>
              <Button onClick={confirmPay} disabled={acting} style={{ flex: 2, height: '88rpx', borderRadius: '999rpx', background: C.green, color: '#FFFFFF', fontSize: '30rpx', fontWeight: '600', lineHeight: '88rpx', border: 'none', textAlign: 'center' }}>{acting ? '...' : '确认支付'}</Button>
            </View>
          </View>
        </View>
      )}

      {/* Bottom fixed button */}
      <View style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: '20rpx 32rpx', paddingBottom: 'calc(20rpx + env(safe-area-inset-bottom))', background: 'rgba(247,246,242,0.96)', boxShadow: '0 -8rpx 24rpx rgba(24,35,30,0.06)', zIndex: 10 }}>
        {isFinished && (userStatus === 'NOT_REGISTERED' || userStatus === 'REGISTERED') && (
          <View style={{ width: '100%', height: '92rpx', borderRadius: '999rpx', background: C.disabledBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: '30rpx', color: C.disabledText, fontWeight: '600' }}>活动已结束</Text>
          </View>
        )}
        {isFinished && userStatus === 'PAID' && (
          <View style={{ width: '100%', height: '92rpx', borderRadius: '999rpx', background: C.disabledBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: '30rpx', color: C.disabledText, fontWeight: '600' }}>活动已结束 · 签到码已失效</Text>
          </View>
        )}
        {!isFinished && (userStatus === 'NOT_REGISTERED' || userStatus === 'REGISTERED') && (
          <Button onClick={handleEnroll} disabled={acting}
            style={{ width: '100%', height: '92rpx', borderRadius: '999rpx', background: acting ? C.disabledBg : C.green, color: acting ? C.disabledText : '#FFFFFF', fontSize: '32rpx', fontWeight: '600', lineHeight: '92rpx', border: 'none', textAlign: 'center' }}
          >{acting ? '...' : '立即报名'}</Button>
        )}
        {!isFinished && userStatus === 'PAID' && (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '12rpx' }}>
            <Button onClick={goQR}
              style={{ width: '100%', height: '92rpx', borderRadius: '999rpx', background: C.green, color: '#FFFFFF', fontSize: '32rpx', fontWeight: '600', lineHeight: '92rpx', border: 'none', textAlign: 'center' }}
            >查看签到码</Button>
            {hasGroupQr && (
              <Button onClick={handleGroupQr}
                style={{ width: '100%', height: '72rpx', borderRadius: '999rpx', background: C.lightGreen, border: `1rpx solid ${C.border}`, color: C.green, fontSize: '28rpx', lineHeight: '72rpx', textAlign: 'center' }}
              >加入活动群</Button>
            )}
          </View>
        )}
        {!isFinished && userStatus === 'CHECKED_IN' && (
          <View style={{ width: '100%', height: '92rpx', borderRadius: '999rpx', background: C.disabledBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: '32rpx', color: C.disabledText, fontWeight: '600' }}>✓ 已签到</Text>
          </View>
        )}
        {!isFinished && userStatus === 'EXPIRED' && (
          <View style={{ width: '100%', height: '92rpx', borderRadius: '999rpx', background: C.disabledBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: '32rpx', color: C.disabledText, fontWeight: '600' }}>二维码已失效</Text>
          </View>
        )}
      </View>

      {/* V2.5C: Group QR popup modal */}
      {showGroupQr && hasGroupQr && (
        <View style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowGroupQr(false)}>
          <View style={{ width: '560rpx', background: C.white, borderRadius: '24rpx', padding: '36rpx 32rpx 28rpx', boxShadow: '0 16rpx 48rpx rgba(0,0,0,0.16)' }} onClick={(e) => e.stopPropagation()}>
            <View style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8rpx' }}>
              <View onClick={() => setShowGroupQr(false)} style={{ width: '48rpx', height: '48rpx', borderRadius: '50%', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: '30rpx', color: C.neutral }}>×</Text>
              </View>
            </View>
            <Text style={{ fontSize: '30rpx', fontWeight: '700', color: C.dark, textAlign: 'center', display: 'block' }}>{activity!.groupQrTitle || '加入活动群'}</Text>
            <Text style={{ fontSize: '25rpx', color: C.neutral, textAlign: 'center', display: 'block', marginTop: '8rpx' }}>{activity!.groupQrDescription || '活动通知、集合安排和现场事项将在群内同步'}</Text>
            <View style={{ textAlign: 'center', marginTop: '20rpx' }}>
              {!groupQrFailed ? (
                <Image src={activity!.groupQrImageUrl!} mode='widthFix' style={{ width: '300rpx', borderRadius: '12rpx' }} onError={() => setGroupQrFailed(true)} />
              ) : (
                <View style={{ padding: '32rpx', background: C.lightGreen, borderRadius: '12rpx' }}>
                  <Text style={{ fontSize: '26rpx', color: C.neutral }}>活动群二维码暂不可用，请联系活动组织者。</Text>
                </View>
              )}
            </View>
            <View style={{ marginTop: '12rpx', padding: '12rpx', background: C.lightGreen, borderRadius: '8rpx' }}>
              <Text style={{ fontSize: '24rpx', color: C.neutral, textAlign: 'center', display: 'block' }}>长按识别二维码加入活动群</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
