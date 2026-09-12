import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { isLoggedIn, navigateToLoginWithRedirect, userAuthHeader } from '../../../utils/user'
import { activityTemporalStateLabel, formatActivityStart, hasUserActivityState, userActivityStateLabel } from '../../../utils/activity-display'

import { API_BASE_URL as API } from '../../../config/api'

const C = {
  bg: '#F7F6F2', card: '#FFFFFF', ink: '#18231E', body: '#3E463F',
  muted: '#8C918C', line: '#E6ECE7', green: '#3F6B4F', softGreen: '#EEF5EF',
  amber: '#8A6D3B', amberBg: '#FFF9E5',
}

interface RegistrationItem {
  registrationId: number
  activityId: number
  activityTitle: string
  activityDescription: string
  activityCoverUrl: string
  activityStartTime: string | null
  activityEndTime: string | null
  activityLocation: string
  province: string
  city: string
  registrationStatus: string
  userActivityState: string
  activityTemporalState: string
  checkinStatus: string
  qrAvailable: boolean
  isCompleted: boolean
}

export default function RegistrationsPage() {
  const [items, setItems] = useState<RegistrationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    if (!isLoggedIn()) {
      navigateToLoginWithRedirect({ returnUrl: '/pages/mine/registrations/index', action: 'OPEN_REGISTRATION' })
      return
    }
    setLoading(true); setError('')
    try {
      const res = await Taro.request({
        url: `${API}/users/me/registrations`,
        header: userAuthHeader(),
      })
      setItems(((res.data as any)?.items || []) as RegistrationItem[])
    } catch (_e) {
      console.error('[mine-registrations] load failed')
      setError('加载失败')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useDidShow(() => { load() })

  const goDetail = (id: number) => Taro.navigateTo({ url: `/pages/activity/detail/index?id=${id}` })
  const goHome = () => Taro.switchTab({ url: '/pages/index/index' })
  const goQR = (item: RegistrationItem) => {
    if (!item.qrAvailable) {
      Taro.showToast({ title: item.checkinStatus === 'CHECKED_IN' ? '你已完成签到' : item.isCompleted ? '二维码已过期' : '二维码暂不可用', icon: 'none' })
      return
    }
    Taro.navigateTo({ url: `/pages/activity/qr/index?activityId=${item.activityId}&title=${encodeURIComponent(item.activityTitle || '')}` })
  }

  if (loading) return <View style={fullC}><Text style={{ fontSize: '28rpx', color: C.muted }}>加载中...</Text></View>
  if (error) return <View style={{ ...fullC, flexDirection: 'column', padding: '48rpx' }}><Text style={{ fontSize: '30rpx', color: C.ink, display: 'block', marginBottom: '16rpx' }}>{error}</Text></View>

  if (items.length === 0) {
    return (
      <View style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48rpx' }}>
        <Text style={{ fontSize: '32rpx', fontWeight: '700', color: C.ink, textAlign: 'center', display: 'block', marginBottom: '12rpx' }}>你还没有报名活动。</Text>
        <View onClick={goHome} style={btnStyle}><Text style={{ color: '#FFFFFF', fontSize: '28rpx' }}>去看看活动</Text></View>
      </View>
    )
  }

  return (
    <ScrollView scrollY style={{ height: '100vh', background: C.bg }}>
      <View style={{ padding: '24rpx 24rpx 80rpx' }}>
        <Text style={{ display: 'block', fontSize: '36rpx', fontWeight: '700', color: C.ink, marginBottom: '16rpx' }}>我的报名</Text>
        {items.map(item => {
          const pendingCheckin = item.userActivityState === 'PENDING_CHECKIN' && !item.isCompleted
          const hasUserState = hasUserActivityState(item.userActivityState)
          return (
            <View key={item.registrationId} onClick={() => goDetail(item.activityId)}
              style={{ marginBottom: '16rpx', background: C.card, borderRadius: '20rpx', padding: '20rpx', border: `1rpx solid ${C.line}`, display: 'flex', flexDirection: 'row', position: 'relative' }}>
              <View style={{ width: '128rpx', height: '128rpx', borderRadius: '12rpx', background: C.softGreen, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.activityCoverUrl ? <Image src={imgUrl(item.activityCoverUrl)} mode='aspectFill' style={{ width: '100%', height: '100%' }} /> : <Text style={{ fontSize: '36rpx', color: C.green }}>行</Text>}
              </View>
              <View style={{ flex: 1, marginLeft: '16rpx', minWidth: 0, paddingRight: hasUserState ? '112rpx' : '0' }}>
                <Text style={{ fontSize: '20rpx', color: item.activityTemporalState === 'ENDED' ? C.muted : C.green, lineHeight: '1.3' }}>{activityTemporalStateLabel(item.activityTemporalState)}</Text>
                <Text style={{ fontSize: '28rpx', fontWeight: '600', color: C.ink, lineHeight: '1.32', marginTop: '6rpx', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.activityTitle || '活动'}</Text>
                {item.activityDescription ? <Text style={{ fontSize: '22rpx', color: C.body, lineHeight: '1.45', marginTop: '8rpx', display: '-webkit-box', overflow: 'hidden', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{item.activityDescription}</Text> : null}
                <Text style={{ fontSize: '22rpx', color: C.muted, display: 'block', marginTop: item.activityDescription ? '10rpx' : '12rpx', lineHeight: '1.4' }}>{formatActivityStart(item.activityStartTime) || '时间待确认'}</Text>
                <Text style={{ fontSize: '22rpx', color: C.muted, display: 'block', marginTop: '5rpx', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.activityLocation || [item.province, item.city].filter(Boolean).join(' · ') || '地点待确认'}</Text>
                {pendingCheckin ? (
                  <View style={{ marginTop: '16rpx', display: 'flex', flexDirection: 'row', gap: '12rpx' }}>
                    <View onClick={(e) => { e.stopPropagation(); goQR(item) }} style={{ padding: '10rpx 24rpx', background: C.green, borderRadius: '999rpx' }}>
                      <Text style={{ fontSize: '23rpx', color: '#FFFFFF', fontWeight: '500' }}>查看签到二维码</Text>
                    </View>
                  </View>
                ) : null}
              </View>
              {hasUserState ? <View style={{ position: 'absolute', right: '20rpx', top: '20rpx', padding: '5rpx 12rpx', borderRadius: '999rpx', background: item.userActivityState === 'CHECKED_IN' || item.userActivityState === 'PENDING_CHECKIN' ? C.softGreen : '#F1F1EE' }}><Text style={{ fontSize: '20rpx', color: item.userActivityState === 'CHECKED_IN' || item.userActivityState === 'PENDING_CHECKIN' ? C.green : C.muted, fontWeight: '600' }}>{userActivityStateLabel(item.userActivityState)}</Text></View> : null}
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}

function imgUrl(path: string): string {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return API + (path.startsWith('/') ? '' : '/') + path
}

const fullC: React.CSSProperties = { minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const btnStyle: React.CSSProperties = { padding: '16rpx 48rpx', background: C.green, borderRadius: '999rpx', display: 'flex', alignItems: 'center', justifyContent: 'center' }
