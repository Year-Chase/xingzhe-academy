import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'

const API = 'http://172.20.10.10:3000'

interface ActivityCard {
  id: number; title: string; description: string; location: string
  startTime: string; capacity: number; registeredCount: number
}

const ICON: Record<number, string> = { 1: '🏃', 2: '🚴', 3: '🧘', 4: '⛰️', 5: '🏊' }

export default function Index() {
  const [activities, setActivities] = useState<ActivityCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchActivities = async () => {
    setLoading(true); setError('')
    try {
      const res = await Taro.request({ url: `${API}/activity` })
      setActivities((res.data as ActivityCard[]) || [])
    } catch { setError('加载失败') }
    finally { setLoading(false) }
  }

  // Initial load
  useEffect(() => { fetchActivities() }, [])

  // onShow — check dirtyActivityId and patch
  useDidShow(() => {
    const dirtyId = Taro.getStorageSync('dirtyActivityId')
    if (!dirtyId) return
    Taro.removeStorageSync('dirtyActivityId')

    Taro.request({ url: `${API}/activity/${dirtyId}` })
      .then((res) => {
        const latest = res.data as any
        setActivities((prev) =>
          prev.map((a) =>
            a.id === latest.id
              ? { ...a, registeredCount: latest.registeredCount ?? a.registeredCount }
              : a
          )
        )
      })
      .catch(() => { /* silently ignore — main list still intact */ })
  })

  const fmtDate = (d: string) => {
    if (!d) return ''; const dt = new Date(d)
    const w = ['日', '一', '二', '三', '四', '五', '六'][dt.getDay()]
    const h = String(dt.getHours()).padStart(2, '0')
    const m = String(dt.getMinutes()).padStart(2, '0')
    return `${dt.getMonth() + 1}月${dt.getDate()}日（周${w}） ${h}:${m}`
  }

  const goDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/activity/detail/index?id=${id}` })
  }

  const goAll = () => {
    Taro.navigateTo({ url: '/pages/activity/list/index' })
  }

  return (
    <View style={{ minHeight: '100vh', background: '#F7F6F2', fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif' }}>
      {/* Brand */}
      <View style={{ padding: '36rpx 32rpx 28rpx' }}>
        <Text style={{ fontSize: '44rpx', fontWeight: '700', color: '#18231E', display: 'block', lineHeight: '1.25' }}>行者学社</Text>
        <Text style={{ fontSize: '26rpx', color: '#666666', fontWeight: '400', display: 'block', marginTop: '8rpx' }}>把身体从屏幕里带出来</Text>
      </View>

      {/* Banner */}
      <View style={{ margin: '0 32rpx 36rpx', height: '240rpx', borderRadius: '24rpx', overflow: 'hidden', background: '#EEF5EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ textAlign: 'center' }}>
          <Text style={{ fontSize: '34rpx', fontWeight: '700', color: '#18231E', display: 'block', lineHeight: '1.35' }}>在城市边界</Text>
          <Text style={{ fontSize: '34rpx', fontWeight: '700', color: '#18231E', display: 'block', lineHeight: '1.35' }}>找到你的山野</Text>
          <Text style={{ fontSize: '24rpx', color: '#8A9288', display: 'block', marginTop: '12rpx' }}>发现自然 · 认识同路人 · 一起出发</Text>
        </View>
      </View>

      {/* Section header */}
      <View style={{ padding: '0 32rpx 20rpx', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: '34rpx', fontWeight: '700', color: '#18231E' }}>行者活动</Text>
        <Text onClick={goAll} style={{ fontSize: '24rpx', color: '#2E7D5A' }}>全部活动 →</Text>
      </View>

      {/* Loading */}
      {loading && (
        <View style={{ padding: '100rpx 32rpx', textAlign: 'center' }}>
          <Text style={{ color: '#8A9288', fontSize: '28rpx' }}>加载中...</Text>
        </View>
      )}

      {/* Error */}
      {error && !loading && (
        <View style={{ margin: '0 32rpx', padding: '40rpx', background: '#FFFFFF', borderRadius: '24rpx', border: '1rpx solid #EDE9DF', textAlign: 'center' }}>
          <Text style={{ fontSize: '28rpx', color: '#B35B4B', display: 'block', marginBottom: '12rpx' }}>{error}</Text>
        </View>
      )}

      {/* Empty */}
      {!loading && !error && activities.length === 0 && (
        <View style={{ padding: '100rpx 32rpx', textAlign: 'center' }}>
          <Text style={{ fontSize: '60rpx', display: 'block', marginBottom: '16rpx' }}>🏃</Text>
          <Text style={{ fontSize: '30rpx', color: '#666666', display: 'block' }}>暂无活动</Text>
          <Text style={{ fontSize: '26rpx', color: '#8A9288', display: 'block', marginTop: '8rpx' }}>新活动即将上线，敬请期待</Text>
        </View>
      )}

      {/* Cards */}
      {activities.map((a) => (
        <View key={a.id} onClick={() => goDetail(a.id)}
          style={{ margin: '0 32rpx 24rpx', background: '#FFFFFF', borderRadius: '24rpx', padding: '20rpx', border: '1rpx solid #EDE9DF', boxShadow: '0 8rpx 24rpx rgba(24,35,30,0.06)', display: 'flex', flexDirection: 'row', boxSizing: 'border-box' }}
        >
          <View style={{ width: '172rpx', height: '172rpx', borderRadius: '18rpx', background: '#EEF5EF', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: '56rpx' }}>{ICON[a.id] || '🏔️'}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0, paddingLeft: '22rpx', display: 'flex', flexDirection: 'column' }}>
            <Text style={{ fontSize: '30rpx', fontWeight: '700', color: '#18231E', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</Text>
            {a.description ? (
              <Text style={{ fontSize: '24rpx', color: '#3A403B', lineHeight: '1.5', marginTop: '6rpx', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{a.description}</Text>
            ) : null}
            {a.startTime ? (
              <Text style={{ fontSize: '23rpx', color: '#666666', lineHeight: '1.4', marginTop: a.description ? '10rpx' : '14rpx' }}>📅 {fmtDate(a.startTime)}</Text>
            ) : null}
            {a.location ? (
              <Text style={{ fontSize: '23rpx', color: '#666666', lineHeight: '1.4', marginTop: '6rpx', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {a.location}</Text>
            ) : null}
            <Text style={{ fontSize: '24rpx', fontWeight: '500', color: '#18231E', marginTop: 'auto', alignSelf: 'flex-end' }}>
              {a.registeredCount ?? 0}<Text style={{ color: '#8A9288', fontWeight: '400' }}> / {a.capacity} 人</Text>
            </Text>
          </View>
        </View>
      ))}

      <View style={{ height: '56rpx' }} />
    </View>
  )
}
