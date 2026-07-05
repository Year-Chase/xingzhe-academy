import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { getUserId } from '../../../utils/user'

import { API_BASE_URL as API } from '../../../config/api'

const C = {
  bg: '#F7F6F2', card: '#FFFFFF', ink: '#18231E', body: '#3E463F',
  muted: '#8C918C', line: '#E6ECE7', green: '#3F6B4F', softGreen: '#EEF5EF',
}

interface ActivityItem {
  activityId: number; title: string; province: string; city: string
  startTime: string; endTime: string; coverImage: string
  isCompleted: boolean; isCheckedIn: boolean
  companionCount: number; certificateStatus: string
}

interface PostpayOrder {
  activityId: number; orderId: number; title: string
  paymentMode: string; prepayStatus: string; postpayStatus: string
  orderPrepayAmount: number; orderPostpayAmount: number
  postpayDate: string | null; postpayPaidAt: string | null
}

export default function RegistrationsPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [postpayMap, setPostpayMap] = useState<Map<number, PostpayOrder>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState(0)

  const load = async () => {
    const uid = getUserId()
    if (!uid) { setError('请先完成登录'); setLoading(false); return }
    setLoading(true); setError('')
    try {
      const [journeyRes, postpayRes] = await Promise.all([
        Taro.request({ url: `${API}/users/${uid}/journey` }).catch(() => ({ data: {} })),
        Taro.request({ url: `${API}/orders/my-postpay?userId=${uid}` }).catch(() => ({ data: [] })),
      ])
      setActivities(((journeyRes.data as any)?.activities || []) as ActivityItem[])

      const orders = (postpayRes.data || []) as PostpayOrder[]
      const map = new Map<number, PostpayOrder>()
      orders.forEach(o => map.set(o.activityId, o))
      setPostpayMap(map)
    } catch (e) { console.error('[mine-registrations]', e); setError('加载失败') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useDidShow(() => { load() })

  // V2.8-D: Mock complete postpay
  const handlePostpay = async (orderId: number) => {
    const uid = getUserId()
    if (actingId) return
    setActingId(orderId)
    try {
      const res = await Taro.request({
        method: 'POST',
        url: `${API}/orders/${orderId}/postpay/mock-pay?userId=${uid}`,
      })
      if ((res.data as any)?.postpayStatus === 'PAID') {
        Taro.showToast({ title: '后付款已完成', icon: 'success' })
        load()
      } else if ((res.data as any)?.error) {
        Taro.showToast({ title: (res.data as any).error, icon: 'none' })
      }
    } catch (e) {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    } finally { setActingId(0) }
  }

  const fmtDate = (s: string) => { if (!s) return ''; const d = new Date(s); return `${d.getMonth()+1}月${d.getDate()}日` }
  const goDetail = (id: number) => Taro.navigateTo({ url: `/pages/activity/detail/index?id=${id}` })
  const goHome = () => Taro.switchTab({ url: '/pages/index/index' })

  const fmtYuan = (n: any) => '¥' + (Number(n) || 0)

  if (loading) return <View style={fullC}><Text style={{ fontSize: '28rpx', color: C.muted }}>加载中...</Text></View>
  if (error) return <View style={{ ...fullC, flexDirection: 'column', padding: '48rpx' }}><Text style={{ fontSize: '30rpx', color: C.ink, display: 'block', marginBottom: '16rpx' }}>{error}</Text></View>

  if (activities.length === 0) {
    return (
      <View style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48rpx' }}>
        <Text style={{ fontSize: '32rpx', fontWeight: '700', color: C.ink, textAlign: 'center', display: 'block', marginBottom: '12rpx' }}>你还没有报名活动。</Text>
        <View onClick={goHome} style={btnStyle}><Text style={{ color: '#FFFFFF', fontSize: '28rpx' }}>去看看活动</Text></View>
      </View>
    )
  }

  // V2.8-D: Count pending postpay
  const pendingPostpayCount = (() => {
    let n = 0
    postpayMap.forEach(o => { if (o.postpayStatus === 'UNPAID' || o.postpayStatus === 'OVERDUE') n++ })
    return n
  })()

  return (
    <ScrollView scrollY style={{ height: '100vh', background: C.bg }}>
      {/* V2.8-D: Pending postpay banner */}
      {pendingPostpayCount > 0 && (
        <View style={{ margin: '16rpx 24rpx 0', padding: '20rpx 24rpx', background: C.softGreen, borderRadius: '16rpx', border: `1rpx solid rgba(63,111,79,0.12)` }}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: '26rpx', fontWeight: '600', color: C.green }}>待完成后付款 · {pendingPostpayCount} 笔</Text>
            <Text style={{ fontSize: '22rpx', color: '#4A7C5D' }}>请及时完成 ↓</Text>
          </View>
        </View>
      )}

      <View style={{ padding: '16rpx 24rpx', paddingBottom: '80rpx' }}>
        {activities.map(a => {
          const po = postpayMap.get(a.activityId)
          const isPendingPostpay = po && (po.postpayStatus === 'UNPAID' || po.postpayStatus === 'OVERDUE')
          const isPostpayPaid = po && po.postpayStatus === 'PAID'
          const isPostpayWaived = po && po.postpayStatus === 'WAIVED'
          return (
            <View key={a.activityId} onClick={() => goDetail(a.activityId)}
              style={{ marginBottom: '16rpx', background: C.card, borderRadius: '20rpx', padding: '20rpx', border: `1rpx solid ${C.line}`, display: 'flex', flexDirection: 'row' }}>
              <View style={{ width: '120rpx', height: '120rpx', borderRadius: '12rpx', background: C.softGreen, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {a.coverImage ? <Image src={a.coverImage.startsWith('http') ? a.coverImage : `${API}${a.coverImage}`} mode='aspectFill' style={{ width: '100%', height: '100%' }} /> : <Text style={{ fontSize: '40rpx' }}>⛰️</Text>}
              </View>
              <View style={{ flex: 1, marginLeft: '16rpx', minWidth: 0 }}>
                <Text style={{ fontSize: '28rpx', fontWeight: '600', color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</Text>
                <Text style={{ fontSize: '22rpx', color: C.muted, marginTop: '4rpx' }}>{a.province}{a.city ? ' · ' + a.city : ''} · {fmtDate(a.startTime)}</Text>
                {/* V2.8-D: Postpay info — PREPAY orders */}
                {po && isPendingPostpay && (
                  <View style={{ marginTop: '10rpx' }}>
                    <Text style={{ fontSize: '22rpx', color: '#4A7C5D', display: 'block' }}>预付款已完成：{fmtYuan(po.orderPrepayAmount)} · 待完成后付款：{fmtYuan(po.orderPostpayAmount)}</Text>
                    {po.postpayDate && <Text style={{ fontSize: '20rpx', color: C.muted, display: 'block', marginTop: '2rpx' }}>后付款日期：{po.postpayDate}</Text>}
                    <View onClick={(e) => { e.stopPropagation(); handlePostpay(po.orderId) }}
                      style={{ marginTop: '8rpx', padding: '8rpx 20rpx', background: C.green, borderRadius: '999rpx', display: 'inline-flex', alignItems: 'center' }}>
                      <Text style={{ fontSize: '22rpx', color: '#FFFFFF', fontWeight: '500' }}>{actingId === po.orderId ? '处理中...' : '完成后付款'}</Text>
                    </View>
                  </View>
                )}
                {po && isPostpayPaid && (
                  <View style={{ marginTop: '10rpx' }}>
                    <Text style={{ fontSize: '22rpx', color: '#4A7C5D', display: 'block' }}>费用已完成 · 预付款 {fmtYuan(po.orderPrepayAmount)} + 后付款 {fmtYuan(po.orderPostpayAmount)}</Text>
                  </View>
                )}
                {po && isPostpayWaived && (
                  <View style={{ marginTop: '10rpx' }}>
                    <Text style={{ fontSize: '22rpx', color: C.muted, display: 'block' }}>后付款已免除</Text>
                  </View>
                )}
                {/* Status tags */}
                <View style={{ marginTop: '10rpx', display: 'flex', gap: '10rpx' }}>
                  {isPendingPostpay ? <Tag label='待后付' color='#8A6D3B' bg='#FFF9E5' /> : null}
                  {a.isCheckedIn ? <Tag label='已签到' color={C.green} bg={C.softGreen} /> : a.isCompleted ? <Tag label='已完成' color='#C98255' bg='#FDF1E7' /> : !isPendingPostpay ? <Tag label='已报名' color={C.green} bg={C.softGreen} /> : null}
                  {a.certificateStatus === 'AVAILABLE' ? <Tag label='有证书' color={C.green} bg={C.softGreen} /> : null}
                </View>
              </View>
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}

function Tag({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <View style={{ padding: '4rpx 12rpx', background: bg, borderRadius: '999rpx' }}><Text style={{ fontSize: '20rpx', color }}>{label}</Text></View>
}

const fullC: React.CSSProperties = { minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const btnStyle: React.CSSProperties = { padding: '16rpx 48rpx', background: C.green, borderRadius: '999rpx', display: 'flex', alignItems: 'center', justifyContent: 'center' }
