import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState, useEffect, useMemo } from 'react'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
import { isLoggedIn, userAuthHeader } from '../../../utils/user'
import { navigateToLoginWithRedirect } from '../../../utils/user'
import { API_BASE_URL as API } from '../../../config/api'

interface Series { id: string; name: string }
interface ActivityItem {
  id: number; title: string; description: string; location: string; startTime: string; endTime: string
  coverImage?: string; imageUrls?: any; category?: { id: string; name: string } | null; series?: Series | null
}

const C = { bg: '#F7F8F5', white: '#FFFFFF', green: '#2E7D5A', dark: '#202923', body: '#4B564F', muted: '#747D77', weak: '#A3AAA5', lightGreen: '#EEF6F1', border: '#E6EAE6' }
const PLACEHOLDER_BG = 'linear-gradient(160deg, #DCE6E2 0%, #BED5C5 36%, #9AB8A8 100%)'

function imgUrl(path?: string) { return !path ? '' : path.startsWith('http') ? path : `${API}${path.startsWith('/') ? '' : '/'}${path}` }
function activityCover(activity: ActivityItem) { try { const images = JSON.parse(activity.imageUrls || 'null'); if (Array.isArray(images) && images.length) return imgUrl(images[0]) } catch {}; return imgUrl(activity.coverImage) }
function activityPage(payload: any): ActivityItem[] { return Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [] }
function phase(activity: ActivityItem) {
  const now = Date.now(); const start = new Date(activity.startTime).getTime(); const end = new Date(activity.endTime).getTime()
  if (Number.isFinite(end) && now > end) return '已结束'
  if (Number.isFinite(start) && now >= start) return '进行中'
  return '即将开始'
}
function fmtDate(value: string) { if (!value) return ''; const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : `${date.getMonth() + 1}月${date.getDate()}日` }

export default function ActivityList() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [selectedSeriesId, setSelectedSeriesId] = useState('')
  const [scope, setScope] = useState<'all' | 'following'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resultTotal, setResultTotal] = useState(0)
  const [checkedInIds, setCheckedInIds] = useState<Set<number>>(new Set())

  const load = async (nextScope = scope, nextSeriesId = selectedSeriesId) => {
    setLoading(true); setError('')
    try {
      const activityUrl = nextScope === 'following'
        ? `${API}/activity/my/follows?page=1&limit=100${nextSeriesId ? `&seriesId=${encodeURIComponent(nextSeriesId)}` : ''}`
        : `${API}/activity/all?page=1&limit=100`
      const [activitiesRes, seriesRes] = await Promise.all([
        Taro.request({ url: activityUrl, header: nextScope === 'following' ? userAuthHeader() : undefined, timeout: 15000 }),
        Taro.request({ url: `${API}/activity/series`, timeout: 15000 }).catch(() => ({ data: [] })),
      ])
      const payload = activitiesRes.data as any
      const firstPage = activityPage(payload)
      const total = Number(payload?.total)
      setResultTotal(Number.isFinite(total) ? total : firstPage.length)
      const pageCount = Number.isFinite(total) ? Math.ceil(total / 100) : 1
      const remainingPages = await Promise.all(
        Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
          Taro.request({ url: nextScope === 'following' ? `${API}/activity/my/follows?page=${index + 2}&limit=100${nextSeriesId ? `&seriesId=${encodeURIComponent(nextSeriesId)}` : ''}` : `${API}/activity/all?page=${index + 2}&limit=100`, header: nextScope === 'following' ? userAuthHeader() : undefined, timeout: 15000 })
        )
      )
      setItems([...firstPage, ...remainingPages.flatMap(response => activityPage(response.data))])
      setSeries(Array.isArray(seriesRes.data) ? seriesRes.data as Series[] : [])
    } catch { setError('加载失败，请下拉重试') } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (!items.length || !isLoggedIn()) { setCheckedInIds(new Set()); return }
    Promise.all(items.map(activity => Taro.request({ url: `${API}/activity/${activity.id}/status`, header: userAuthHeader() }).catch(() => ({ data: {} })).then(result => ({ id: activity.id, status: (result.data as any)?.status })))).then(results => setCheckedInIds(new Set(results.filter(result => result.status === 'CHECKED_IN').map(result => result.id))))
  }, [items])
  usePullDownRefresh(() => { load().then(() => Taro.stopPullDownRefresh()) })

  const changeScope = (nextScope: 'all' | 'following') => {
    if (nextScope === 'following' && !isLoggedIn()) {
      navigateToLoginWithRedirect({ returnUrl: '/pages/activity/list/index' })
      return
    }
    setScope(nextScope)
    load(nextScope, selectedSeriesId)
  }

  const changeSeries = (nextSeriesId: string) => {
    setSelectedSeriesId(nextSeriesId)
    if (scope === 'following') load(scope, nextSeriesId)
  }

  const chooseSeries = async () => {
    const options = [{ id: '', name: '全部品牌' }, ...series]
    const result = await Taro.showActionSheet({ itemList: options.map(item => `${selectedSeriesId === item.id ? '✓ ' : ''}${item.name}`), alertText: '选择品牌' }).catch(() => null)
    if (result && typeof result.tapIndex === 'number') changeSeries(options[result.tapIndex]?.id || '')
  }

  const visibleItems = useMemo(() => items.filter(activity => !selectedSeriesId || activity.series?.id === selectedSeriesId).sort((a, b) => {
    const aEnded = phase(a) === '已结束'; const bEnded = phase(b) === '已结束'
    if (aEnded !== bEnded) return aEnded ? 1 : -1
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  }), [items, selectedSeriesId])

  return <ScrollView scrollY style={{ height: '100vh', background: C.bg }}>
    <View style={{ margin: '18rpx 24rpx 18rpx', height: '66rpx', background: '#EEF1EE', borderRadius: '999rpx', padding: '4rpx', display: 'flex', boxSizing: 'border-box' }}>
      {[{ id: 'all', label: '全部活动' }, { id: 'following', label: '我的关注' }].map(item => <View key={item.id} onClick={() => changeScope(item.id as 'all' | 'following')} style={{ flex: 1, borderRadius: '999rpx', background: scope === item.id ? C.white : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: '24rpx', color: scope === item.id ? C.dark : C.muted, fontWeight: scope === item.id ? '600' : '400' }}>{item.label}</Text></View>)}
    </View>
    <View style={{ margin: '0 24rpx 18rpx', paddingBottom: '16rpx', borderBottom: `1rpx solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: '23rpx', color: '#8A918C' }}>{resultTotal} 个活动</Text>
      <View onClick={chooseSeries} style={{ maxWidth: '360rpx', minHeight: '52rpx', paddingLeft: '20rpx', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}><Text style={{ fontSize: '23rpx', color: selectedSeriesId ? C.green : C.body, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>品牌：{series.find(item => item.id === selectedSeriesId)?.name || '全部'}　&gt;</Text></View>
    </View>
    {loading ? <Center text='加载中...' /> : error ? <Center text={error} /> : visibleItems.length === 0 ? <Center text='暂时没有活动' /> : visibleItems.map(activity => {
      const state = phase(activity); const ended = state === '已结束'; const checkedIn = checkedInIds.has(activity.id); const cover = activityCover(activity)
      return <View key={activity.id} onClick={() => Taro.navigateTo({ url: `/pages/activity/detail/index?id=${activity.id}` })} style={{ margin: '0 24rpx 20rpx', background: C.white, borderRadius: '22rpx', padding: '16rpx', border: `1rpx solid ${C.border}`, display: 'flex', flexDirection: 'row', boxSizing: 'border-box', opacity: ended ? 0.62 : 1 }}>
        <View style={{ width: '176rpx', height: '132rpx', borderRadius: '16rpx', background: PLACEHOLDER_BG, flexShrink: 0, overflow: 'hidden' }}>{cover ? <Image src={cover} mode='aspectFill' style={{ width: '100%', height: '100%' }} /> : null}</View>
        <View style={{ flex: 1, minWidth: 0, paddingLeft: '18rpx', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <View><View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8rpx', marginBottom: '8rpx' }}>{activity.category?.name ? <View style={categoryBadge}><Text style={categoryText}>{activity.category.name}</Text></View> : null}<Text style={{ fontSize: '21rpx', color: ended ? C.weak : C.green, fontWeight: '500' }}>{checkedIn ? '已参加' : state}</Text></View><Text style={{ fontSize: '28rpx', fontWeight: '600', color: C.dark, lineHeight: '1.32', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.title}</Text></View>
          <View>{activity.startTime ? <Text style={{ fontSize: '22rpx', color: C.muted, display: 'block' }}>{fmtDate(activity.startTime)}{activity.endTime ? ` - ${fmtDate(activity.endTime)}` : ''}</Text> : null}{activity.location ? <Text style={{ fontSize: '22rpx', color: C.muted, display: 'block', marginTop: '5rpx', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.location}</Text> : null}</View>
        </View>
      </View>
    })}
    <View style={{ height: '120rpx' }} />
  </ScrollView>
}

function Center({ text }: { text: string }) { return <View style={{ padding: '120rpx 32rpx', textAlign: 'center' }}><Text style={{ fontSize: '28rpx', color: C.muted }}>{text}</Text></View> }
const categoryBadge: React.CSSProperties = { flexShrink: 0, height: '38rpx', padding: '0 12rpx', borderRadius: '999rpx', background: C.lightGreen, display: 'flex', alignItems: 'center' }
const categoryText: React.CSSProperties = { fontSize: '21rpx', color: '#507962', fontWeight: '500' }
