import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect, useCallback } from 'react'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
import { isLoggedIn, userAuthHeader } from '../../../utils/user'

import { API_BASE_URL as API } from '../../../config/api'

interface ActivityItem {
  id: number; title: string; description: string; location: string
  startTime: string; endTime: string; capacity: number; registeredCount: number; status: string
}

const ICON: Record<number, string> = { 1: '🏃', 2: '🚴', 3: '🧘', 4: '⛰️', 5: '🏊' }

export default function ActivityList() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  // Store which activities the current user is CHECKED_IN
  const [checkedInIds, setCheckedInIds] = useState<Set<number>>(new Set())

  const fetchPage = useCallback(async (p: number, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true)
    setError('')
    try {
      const res = await Taro.request({ url: `${API}/activity/all?page=${p}&limit=50` })
      const data = res.data as any
      // Compatible with: plain array, { items }, { data: { items } }
      let list: ActivityItem[] = []
      if (Array.isArray(data)) {
        list = data
      } else if (data && Array.isArray(data.items)) {
        list = data.items
      } else if (data && data.data && Array.isArray(data.data.items)) {
        list = data.data.items
      }
      setTotal(typeof data.total === 'number' ? data.total : (data.data?.total ?? list.length))
      if (append) setItems((prev) => [...prev, ...list])
      else setItems(list)
    } catch (e) { console.error('[activity-list]', e); setError('加载失败') }
    finally { setLoadingMore(false); setLoading(false) }
  }, [])

  // Check which activities current user has CHECKED_IN
  useEffect(() => {
    if (items.length === 0) return
    if (!isLoggedIn()) {
      setCheckedInIds(new Set())
      return
    }
    Promise.all(
      items.map((a) =>
        Taro.request({ url: `${API}/activity/${a.id}/status`, header: userAuthHeader() }).catch(() => ({ data: { status: '' } }))
          .then((r) => ({ id: a.id, status: (r.data as any)?.status }))
          .catch(() => ({ id: a.id, status: '' }))
      )
    ).then((results) => {
      const ids = new Set<number>()
      results.forEach((r) => { if (r.status === 'CHECKED_IN') ids.add(r.id) })
      setCheckedInIds(ids)
    })
  }, [items.length === 0 ? 0 : Math.min(items[0]?.id ?? 0, 0), items.length])

  useEffect(() => { fetchPage(1, false) }, [])

  usePullDownRefresh(() => {
    setPage(1)
    fetchPage(1, false).then(() => Taro.stopPullDownRefresh())
  })

  const loadMore = () => {
    if (loadingMore || items.length >= total) return
    const next = page + 1
    setPage(next)
    fetchPage(next, true)
  }

  const goDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/activity/detail/index?id=${id}` })
  }

  const fmtDate = (d: string) => {
    if (!d) return ''; const dt = new Date(d)
    const w = ['日', '一', '二', '三', '四', '五', '六'][dt.getDay()]
    return `${dt.getMonth() + 1}月${dt.getDate()}日（周${w}） ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
  }

  const isEnded = (a: ActivityItem) => {
    if (!a.endTime) return false
    const t = new Date(a.endTime).getTime()
    return !Number.isNaN(t) && Date.now() > t
  }
  const isPublished = (a: ActivityItem) => a.status === 'PUBLISHED'
  const isCheckedIn = (id: number) => checkedInIds.has(id)

  if (loading) return <View style={{ padding: '120rpx 32rpx', textAlign: 'center', minHeight: '100vh', background: '#F7F6F2' }}><Text style={{ color: '#8A9288', fontSize: '28rpx' }}>加载中...</Text></View>
  if (error) return <View style={{ padding: '160rpx 32rpx', textAlign: 'center', minHeight: '100vh', background: '#F7F6F2' }}><Text style={{ display: 'block', fontSize: '32rpx', color: '#333A34', marginBottom: '20rpx' }}>{error}</Text></View>
  if (!loading && !error && items.length === 0) return (
    <View style={{ padding: '200rpx 32rpx', textAlign: 'center', minHeight: '100vh', background: '#F7F6F2' }}>
      <Text style={{ fontSize: '60rpx', display: 'block', marginBottom: '16rpx' }}>🏃</Text>
      <Text style={{ fontSize: '30rpx', color: '#666666', display: 'block' }}>暂无活动</Text>
      <Text style={{ fontSize: '26rpx', color: '#8A9288', display: 'block', marginTop: '8rpx' }}>新活动即将上线，敬请期待</Text>
    </View>
  )

  return (
    <ScrollView scrollY style={{ height: '100vh', background: '#F7F6F2' }} onScrollToLower={loadMore}>
      <View style={{ padding: '24rpx 32rpx 0', fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif' }}>
        <Text style={{ fontSize: '34rpx', fontWeight: '700', color: '#18231E', display: 'block', marginBottom: '24rpx' }}>全部活动</Text>

        {items.map((a) => {
          const ended = isEnded(a)
          const checkedIn = isCheckedIn(a.id)
          return (
            <View key={a.id} onClick={() => goDetail(a.id)}
              style={{ marginBottom: '24rpx', background: '#FFFFFF', borderRadius: '24rpx', padding: '20rpx', border: '1rpx solid #EDE9DF', boxShadow: '0 8rpx 24rpx rgba(24,35,30,0.06)', display: 'flex', flexDirection: 'row', boxSizing: 'border-box', opacity: ended ? 0.6 : 1, position: 'relative' }}
            >
              {/* 已参加 stamp */}
              {checkedIn && (
                <View style={{ position: 'absolute', top: '16rpx', right: '16rpx', padding: '4rpx 16rpx', background: 'rgba(238,245,239,0.92)', border: '2rpx solid #2E7D5A', borderRadius: '999rpx', zIndex: 2, transform: 'rotate(-6deg)' }}>
                  <Text style={{ fontSize: '22rpx', color: '#2E7D5A', fontWeight: '600' }}>已参加</Text>
                </View>
              )}

              <View style={{ width: '172rpx', height: '172rpx', borderRadius: '18rpx', background: ended ? '#E9EAE5' : '#EEF5EF', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: '56rpx', opacity: ended ? 0.5 : 1 }}>{ICON[a.id] || '🏔️'}</Text>
              </View>

              <View style={{ flex: 1, minWidth: 0, paddingLeft: '22rpx', display: 'flex', flexDirection: 'column' }}>
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ flex: 1, fontSize: '30rpx', fontWeight: '700', color: ended ? '#8A9288' : '#18231E', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</Text>
                  {ended && !checkedIn && (
                    <View style={{ flexShrink: 0, marginLeft: '8rpx', padding: '4rpx 12rpx', background: '#E9EAE5', borderRadius: '999rpx' }}>
                      <Text style={{ fontSize: '20rpx', color: '#8A9288' }}>已结束</Text>
                    </View>
                  )}
                </View>
                {a.description ? (
                  <Text style={{ fontSize: '24rpx', color: ended ? '#A6AAA2' : '#3A403B', lineHeight: '1.5', marginTop: '6rpx', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{a.description}</Text>
                ) : null}
                {a.startTime ? (
                  <Text style={{ fontSize: '23rpx', color: ended ? '#A6AAA2' : '#666666', lineHeight: '1.4', marginTop: a.description ? '10rpx' : '14rpx' }}>📅 {fmtDate(a.startTime)}</Text>
                ) : null}
                {a.location ? (
                  <Text style={{ fontSize: '23rpx', color: ended ? '#A6AAA2' : '#666666', lineHeight: '1.4', marginTop: '6rpx', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {a.location}</Text>
                ) : null}
              </View>
            </View>
          )
        })}

        {loadingMore && <View style={{ padding: '40rpx', textAlign: 'center' }}><Text style={{ color: '#8A9288', fontSize: '26rpx' }}>加载更多...</Text></View>}
        {items.length >= total && items.length > 0 && <View style={{ padding: '40rpx', textAlign: 'center' }}><Text style={{ color: '#A6AAA2', fontSize: '24rpx' }}>— 已展示全部活动 —</Text></View>}
        <View style={{ height: '80rpx' }} />
      </View>
    </ScrollView>
  )
}
