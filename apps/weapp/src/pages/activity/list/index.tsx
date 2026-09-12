import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect, useMemo } from 'react'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
import { isLoggedIn, userAuthHeader } from '../../../utils/user'
import { navigateToLoginWithRedirect } from '../../../utils/user'
import { API_BASE_URL as API } from '../../../config/api'
import { ActivityCard } from '../../../components/activity-card'

interface Series { id: string; name: string }
interface ActivityItem {
  id: number; title: string; description: string; location: string; startTime: string; endTime: string
  coverImage?: string; imageUrls?: any; category?: { id: string; name: string } | null; series?: Series | null
  userActivityState?: string
  activityTemporalState?: string
}

const C = { bg: '#F7F8F5', white: '#FFFFFF', green: '#2E7D5A', dark: '#202923', body: '#4B564F', muted: '#747D77', weak: '#A3AAA5', lightGreen: '#EEF6F1', border: '#E6EAE6' }
function activityPage(payload: any): ActivityItem[] { return Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [] }
function phase(activity: ActivityItem) {
  const now = Date.now(); const start = new Date(activity.startTime).getTime(); const end = new Date(activity.endTime).getTime()
  if (Number.isFinite(end) && now > end) return '已结束'
  if (Number.isFinite(start) && now >= start) return '进行中'
  return '即将开始'
}
export default function ActivityList() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [selectedSeriesId, setSelectedSeriesId] = useState('')
  const [scope, setScope] = useState<'all' | 'following'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resultTotal, setResultTotal] = useState(0)

  const load = async (nextScope = scope, nextSeriesId = selectedSeriesId) => {
    setLoading(true); setError('')
    try {
      const activityUrl = nextScope === 'following'
        ? `${API}/activity/my/follows?page=1&limit=100${nextSeriesId ? `&seriesId=${encodeURIComponent(nextSeriesId)}` : ''}`
        : `${API}/activity/all?page=1&limit=100${nextSeriesId ? `&seriesId=${encodeURIComponent(nextSeriesId)}` : ''}`
      const [activitiesRes, seriesRes] = await Promise.all([
        Taro.request({ url: activityUrl, header: isLoggedIn() ? userAuthHeader() : undefined, timeout: 15000 }),
        Taro.request({ url: `${API}/activity/series/activity-filter`, timeout: 15000 }).catch(() => ({ data: [] })),
      ])
      const payload = activitiesRes.data as any
      const firstPage = activityPage(payload)
      const total = Number(payload?.total)
      setResultTotal(Number.isFinite(total) ? total : firstPage.length)
      const pageCount = Number.isFinite(total) ? Math.ceil(total / 100) : 1
      const remainingPages = await Promise.all(
        Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
          Taro.request({ url: nextScope === 'following' ? `${API}/activity/my/follows?page=${index + 2}&limit=100${nextSeriesId ? `&seriesId=${encodeURIComponent(nextSeriesId)}` : ''}` : `${API}/activity/all?page=${index + 2}&limit=100${nextSeriesId ? `&seriesId=${encodeURIComponent(nextSeriesId)}` : ''}`, header: isLoggedIn() ? userAuthHeader() : undefined, timeout: 15000 })
        )
      )
      setItems([...firstPage, ...remainingPages.flatMap(response => activityPage(response.data))])
      setSeries(Array.isArray(seriesRes.data) ? seriesRes.data as Series[] : [])
    } catch { setError('加载失败，请下拉重试') } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  usePullDownRefresh(() => { load().then(() => Taro.stopPullDownRefresh()) })

  const changeScope = (nextScope: 'all' | 'following') => {
    if (nextScope === 'following' && !isLoggedIn()) {
      navigateToLoginWithRedirect({ returnUrl: '/pages/activity/list/index' })
      return
    }
    setScope(nextScope)
    load(nextScope, selectedSeriesId)
  }

  const selectSeries = (id: string) => {
    setSelectedSeriesId(id)
    load(scope, id)
  }

  const visibleItems = useMemo(() => items.sort((a, b) => {
    const aEnded = phase(a) === '已结束'; const bEnded = phase(b) === '已结束'
    if (aEnded !== bEnded) return aEnded ? 1 : -1
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  }), [items])

  return <ScrollView scrollY style={{ height: '100vh', background: C.bg }}>
    <View style={{ margin: '18rpx 24rpx 18rpx', height: '66rpx', background: '#EEF1EE', borderRadius: '999rpx', padding: '4rpx', display: 'flex', boxSizing: 'border-box' }}>
      {[{ id: 'all', label: '全部活动' }, { id: 'following', label: '我的关注' }].map(item => <View key={item.id} onClick={() => changeScope(item.id as 'all' | 'following')} style={{ flex: 1, borderRadius: '999rpx', background: scope === item.id ? C.white : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: '24rpx', color: scope === item.id ? C.dark : C.muted, fontWeight: scope === item.id ? '600' : '400' }}>{item.label}</Text></View>)}
    </View>
    <View style={{ margin: '0 24rpx 18rpx', paddingBottom: '16rpx', borderBottom: `1rpx solid ${C.border}` }}>
      <Text style={{ fontSize: '23rpx', color: '#8A918C', display: 'block', marginBottom: '12rpx' }}>{resultTotal} 个活动</Text>
      <ScrollView scrollX style={{ width: '100%', whiteSpace: 'nowrap' }}>
        <View style={{ display: 'flex', flexDirection: 'row', gap: '10rpx' }}>
          {[{ id: '', name: '全部' }, ...series].map(item => <View key={item.id || 'all'} onClick={() => selectSeries(item.id)} style={{ padding: '8rpx 18rpx', borderRadius: '999rpx', background: selectedSeriesId === item.id ? C.green : '#EEF1EE' }}><Text style={{ fontSize: '22rpx', color: selectedSeriesId === item.id ? '#FFFFFF' : C.body }}>{item.name}</Text></View>)}
        </View>
      </ScrollView>
    </View>
    {loading ? <Center text='加载中...' /> : error ? <Center text={error} /> : visibleItems.length === 0 ? <Center text='暂时没有活动' /> : visibleItems.map(activity => <ActivityCard key={activity.id} activity={activity} />)}
    <View style={{ height: '120rpx' }} />
  </ScrollView>
}

function Center({ text }: { text: string }) { return <View style={{ padding: '120rpx 32rpx', textAlign: 'center' }}><Text style={{ fontSize: '28rpx', color: C.muted }}>{text}</Text></View> }
