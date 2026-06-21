import { View, Text, Button, ScrollView } from '@tarojs/components'
import { useState, useEffect, useCallback } from 'react'
import Taro, { useRouter } from '@tarojs/taro'

const API = 'http://172.20.10.10:3000'
const CURRENT_USER = '1'

interface ActivityData {
  id: number; title: string; description: string; location: string
  startTime: string; endTime: string; capacity: number; registeredCount: number
  coverImage: string; status: string
}

interface Participant {
  userId: string; avatarUrl: string; nickname: string; name: string
  gender: string; commonActivityCount: number; motto: string; status: string
}

type RegStatus = 'NOT_REGISTERED' | 'REGISTERED' | 'PAID' | 'CHECKED_IN' | 'EXPIRED'

const C = {
  bg: '#F7F6F2', white: '#FFFFFF', green: '#2E7D5A', dark: '#18231E',
  body: '#333A34', neutral: '#666666', secondary: '#8A9288',
  lightGreen: '#EEF5EF', border: '#EDE9DF', disabledBg: '#E9EAE5', disabledText: '#8A9288',
}

const STATUS_LABEL: Record<RegStatus, string> = {
  NOT_REGISTERED: '可报名', REGISTERED: '待支付', PAID: '已报名', CHECKED_IN: '已签到', EXPIRED: '已过期',
}

const ICON: Record<number, string> = { 1: '🏃', 2: '🚴', 3: '🧘', 4: '⛰️', 5: '🏊' }
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

  useEffect(() => { const p = router.params as any; if (p.id) setId(Number(p.id)) }, [router.params])
  useEffect(() => { if (id === 0) return; load(id) }, [id])

  const load = useCallback(async (activityId: number) => {
    setLoading(true); setError('')
    try {
      const [d, s, p] = await Promise.all([
        Taro.request({ url: `${API}/activity/${activityId}` }),
        Taro.request({ url: `${API}/activity/${activityId}/status?userId=1` }),
        Taro.request({ url: `${API}/activity/${activityId}/participants?userId=1` }).catch(() => ({ data: [] })),
      ])
      setActivity(d.data as ActivityData)
      setUserStatus((s.data as any).status || 'NOT_REGISTERED')
      setParticipants((p.data as Participant[]) || [])
    } catch { setError('加载失败，请下拉重试') }
    finally { setLoading(false) }
  }, [])

  const handleEnroll = async () => {
    const cap = activity?.capacity ?? 0
    const reg = activity?.registeredCount ?? 0
    if (cap > 0 && reg >= cap) { Taro.showToast({ title: '活动名额已满', icon: 'none' }); return }
    setShowPayConfirm(true)
  }

  const confirmPay = async () => {
    setShowPayConfirm(false)
    if (acting) return; setActing(true)
    try {
      const res = await Taro.request({ method: 'POST', url: `${API}/activity/${id}/enroll-pay?userId=1` })
      if (res.data?.status === 'PAID') {
        Taro.showToast({ title: '报名成功', icon: 'success' })
        // Write dirtyActivityId for list page to patch on return
        Taro.setStorageSync('dirtyActivityId', id)
        await load(id)
      } else if (res.data?.message) {
        Taro.showToast({ title: res.data.message, icon: 'none' })
      }
    } catch { Taro.showToast({ title: '操作失败，请重试', icon: 'none' }) }
    finally { setActing(false) }
  }

  const cancelPay = () => { setShowPayConfirm(false) }
  const goQR = () => {
    Taro.navigateTo({ url: `/pages/activity/qr/index?activityId=${id}&title=${encodeURIComponent(activity?.title || '')}` })
  }

  const fmtDate = (d: string) => { if (!d) return ''; const dt = new Date(d); const w = ['日', '一', '二', '三', '四', '五', '六'][dt.getDay()]; return `${dt.getMonth() + 1}月${dt.getDate()}日（周${w}）` }
  const fmtTime = (s: string, e: string) => { if (!s) return ''; const sd = new Date(s); const ed = e ? new Date(e) : null; const ts = `${String(sd.getHours()).padStart(2, '0')}:${String(sd.getMinutes()).padStart(2, '0')}`; if (!ed) return ts; const te = `${String(ed.getHours()).padStart(2, '0')}:${String(ed.getMinutes()).padStart(2, '0')}`; return `${ts} - ${te}` }

  const reg = activity?.registeredCount ?? 0
  const cap = activity?.capacity ?? 0
  const isSelf = (p: Participant) => p.userId === CURRENT_USER

  if (loading) return <View style={{ padding: '120rpx 32rpx', textAlign: 'center', minHeight: '100vh', background: C.bg }}><Text style={{ color: C.secondary, fontSize: '28rpx' }}>加载中...</Text></View>
  if (error || !activity) return <View style={{ padding: '160rpx 32rpx', textAlign: 'center', minHeight: '100vh', background: C.bg }}><Text style={{ display: 'block', fontSize: '32rpx', color: C.body, marginBottom: '20rpx' }}>{error || '活动未找到'}</Text><Button onClick={() => load(id)} style={{ height: '88rpx', borderRadius: '999rpx', background: C.green, color: '#FFFFFF', fontSize: '30rpx', lineHeight: '88rpx', border: 'none', padding: '0 56rpx' }}>重试</Button></View>

  return (
    <View style={{ minHeight: '100vh', background: C.bg, paddingBottom: '180rpx', fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif' }}>

      {/* Cover */}
      <View style={{ width: '100%', height: '300rpx', background: 'linear-gradient(160deg, #DCE6E2 0%, #BED5C5 30%, #9AB8A8 65%, #789A85 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: '88rpx' }}>{ICON[id] || '🏔️'}</Text>
      </View>

      {/* Title + status pill */}
      <View style={{ margin: '0 32rpx', padding: '32rpx 0 0' }}>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
          <Text style={{ flex: 1, fontSize: '40rpx', fontWeight: '700', color: C.dark, lineHeight: '1.25' }}>{activity.title}</Text>
          <View style={{ flexShrink: 0, marginLeft: '16rpx', marginTop: '6rpx', padding: '6rpx 16rpx', borderRadius: '999rpx', background: C.lightGreen }}>
            <Text style={{ fontSize: '22rpx', color: C.green, fontWeight: '500' }}>{STATUS_LABEL[userStatus]}</Text>
          </View>
        </View>
      </View>

      {/* Info card */}
      <View style={{ margin: '24rpx 32rpx 0', background: C.white, borderRadius: '24rpx', padding: '28rpx', border: '1rpx solid #EDE9DF', boxShadow: '0 8rpx 24rpx rgba(24,35,30,0.06)' }}>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', paddingBottom: '22rpx', marginBottom: '22rpx', borderBottom: '1rpx solid #EDE9DF' }}>
          <View style={{ width: '120rpx', flexShrink: 0, display: 'flex', flexDirection: 'row', alignItems: 'center' }}><Text style={{ fontSize: '28rpx', marginRight: '10rpx' }}>📅</Text><Text style={{ fontSize: '26rpx', color: C.neutral }}>时间</Text></View>
          <View style={{ flex: 1, minWidth: 0 }}><Text style={{ fontSize: '26rpx', color: C.dark, display: 'block' }}>{fmtDate(activity.startTime)}</Text><Text style={{ fontSize: '25rpx', color: C.neutral, display: 'block', marginTop: '4rpx' }}>{fmtTime(activity.startTime, activity.endTime)}</Text></View>
        </View>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', paddingBottom: '22rpx', marginBottom: '22rpx', borderBottom: '1rpx solid #EDE9DF' }}>
          <View style={{ width: '120rpx', flexShrink: 0, display: 'flex', flexDirection: 'row', alignItems: 'center' }}><Text style={{ fontSize: '28rpx', marginRight: '10rpx' }}>📍</Text><Text style={{ fontSize: '26rpx', color: C.neutral }}>地点</Text></View>
          <Text style={{ flex: 1, fontSize: '26rpx', color: C.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.location || '待定'}</Text>
        </View>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: '120rpx', flexShrink: 0, display: 'flex', flexDirection: 'row', alignItems: 'center' }}><Text style={{ fontSize: '28rpx', marginRight: '10rpx' }}>👥</Text><Text style={{ fontSize: '26rpx', color: C.neutral }}>名额</Text></View>
          <Text style={{ fontSize: '26rpx', color: C.body }}><Text style={{ fontWeight: '700', color: C.dark }}>{reg}</Text><Text style={{ color: C.secondary }}> / {cap} 人已报名</Text></Text>
        </View>
      </View>

      {/* 活动介绍 */}
      {activity.description ? (
        <View style={{ margin: '24rpx 32rpx 0', background: C.white, borderRadius: '24rpx', padding: '30rpx', border: '1rpx solid #EDE9DF', boxShadow: '0 8rpx 24rpx rgba(24,35,30,0.05)' }}>
          <Text style={{ fontSize: '32rpx', fontWeight: '700', color: C.dark, display: 'block', marginBottom: '20rpx' }}>活动介绍</Text>
          <Text style={{ fontSize: '27rpx', color: C.body, lineHeight: '1.65' }}>{activity.description}</Text>
        </View>
      ) : null}

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

      {/* ── 已报名行者 ── */}
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

      {/* ── Modal: participant detail ── */}
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
              {modalUser.name}{isSelf(modalUser) ? '（我）' : ''}
              {modalUser.gender !== '未知' && <Text style={{ fontSize: '26rpx', color: C.green, marginLeft: '8rpx' }}>{GENDER_ICON[modalUser.gender] || ''}</Text>}
            </Text>
            {/* Common activities — only for others, not self */}
            {!isSelf(modalUser) && (
              <Text style={{ fontSize: '26rpx', color: C.green, textAlign: 'center', marginTop: '14rpx' }}>👥 共同参加 {modalUser.commonActivityCount} 场活动</Text>
            )}
            <View style={{ background: '#FBFAF6', border: '1rpx solid #EDE9DF', borderRadius: '18rpx', padding: '24rpx', marginTop: '28rpx' }}>
              <Text style={{ fontSize: '26rpx', fontWeight: '600', color: C.dark, display: 'block' }}>金句</Text>
              <Text style={{ fontSize: '26rpx', color: C.body, lineHeight: '1.6', marginTop: '12rpx' }}>{modalUser.motto ? `"${modalUser.motto}"` : '他还没有留下金句。'}</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Modal: mock 支付确认 ── */}
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
        {(userStatus === 'NOT_REGISTERED' || userStatus === 'REGISTERED') && (
          <Button onClick={handleEnroll} disabled={acting}
            style={{ width: '100%', height: '92rpx', borderRadius: '999rpx', background: acting ? C.disabledBg : C.green, color: acting ? C.disabledText : '#FFFFFF', fontSize: '32rpx', fontWeight: '600', lineHeight: '92rpx', border: 'none', textAlign: 'center' }}
          >{acting ? '...' : '立即报名'}</Button>
        )}
        {userStatus === 'PAID' && (
          <Button onClick={goQR}
            style={{ width: '100%', height: '92rpx', borderRadius: '999rpx', background: C.green, color: '#FFFFFF', fontSize: '32rpx', fontWeight: '600', lineHeight: '92rpx', border: 'none', textAlign: 'center' }}
          >查看签到码</Button>
        )}
        {userStatus === 'CHECKED_IN' && (
          <View style={{ width: '100%', height: '92rpx', borderRadius: '999rpx', background: C.disabledBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: '32rpx', color: C.disabledText, fontWeight: '600' }}>✓ 已签到</Text>
          </View>
        )}
        {userStatus === 'EXPIRED' && (
          <View style={{ width: '100%', height: '92rpx', borderRadius: '999rpx', background: C.disabledBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: '32rpx', color: C.disabledText, fontWeight: '600' }}>二维码已失效</Text>
          </View>
        )}
      </View>
    </View>
  )
}
