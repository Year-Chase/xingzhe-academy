import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState, useEffect, useCallback } from 'react'
import Taro, { usePullDownRefresh, useRouter } from '@tarojs/taro'
import { isLoggedIn, userAuthHeader } from '../../../utils/user'

import { API_BASE_URL as API } from '../../../config/api'

interface ActivityCategory {
  id: string
  name: string
  code: string
  description: string
  icon: string
  count: number
}

interface ActivityItem {
  id: number
  title: string
  description: string
  location: string
  startTime: string
  endTime: string
  capacity: number
  registeredCount: number
  status: string
  coverImage?: string
  imageUrls?: any
  category?: { id: string; name: string } | null
}

const PLACEHOLDER_BG = 'linear-gradient(160deg, #DCE6E2 0%, #BED5C5 36%, #9AB8A8 100%)'

function imgUrl(cover: string | undefined): string {
  if (!cover) return ''
  if (cover.startsWith('http')) return cover
  return API + (cover.startsWith('/') ? '' : '/') + cover
}

function activityCover(a: ActivityItem) {
  try {
    const urls = JSON.parse((a as any).imageUrls || 'null')
    if (Array.isArray(urls) && urls.length > 0) return imgUrl(urls[0])
  } catch {}
  return imgUrl(a.coverImage)
}

function ImgWithFallback({ src, style }: { src: string; style: React.CSSProperties }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return null
  return <Image src={src} mode='aspectFill' style={style} onError={() => setFailed(true)} />
}

export default function ActivityList() {
  const router = useRouter()
  const initialCategoryId = String(router.params?.categoryId || '')
  const [items, setItems] = useState<ActivityItem[]>([])
  const [categories, setCategories] = useState<ActivityCategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategoryId)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [checkedInIds, setCheckedInIds] = useState<Set<number>>(new Set())

  const fetchCategories = useCallback(async () => {
    try {
      const res = await Taro.request({ url: `${API}/activity/categories`, timeout: 15000 })
      setCategories(Array.isArray(res.data) ? res.data as ActivityCategory[] : [])
    } catch {
      setCategories([])
    }
  }, [])

  const fetchPage = useCallback(async (p: number, append: boolean, categoryId = selectedCategoryId) => {
    if (append) setLoadingMore(true); else setLoading(true)
    setError('')
    try {
      const categoryQuery = categoryId ? `&categoryId=${encodeURIComponent(categoryId)}` : ''
      const res = await Taro.request({ url: `${API}/activity/all?page=${p}&limit=20${categoryQuery}`, timeout: 15000 })
      const data = res.data as any
      let list: ActivityItem[] = []
      if (Array.isArray(data)) list = data
      else if (data && Array.isArray(data.items)) list = data.items
      else if (data && data.data && Array.isArray(data.data.items)) list = data.data.items
      setTotal(typeof data.total === 'number' ? data.total : (data.data?.total ?? list.length))
      if (append) setItems((prev) => [...prev, ...list])
      else setItems(list)
    } catch (_e) {
      setError('加载失败')
    } finally {
      setLoadingMore(false)
      setLoading(false)
    }
  }, [selectedCategoryId])

  useEffect(() => {
    fetchCategories()
    fetchPage(1, false, initialCategoryId)
  }, [])

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
  }, [items.length === 0 ? 0 : items.map((a) => a.id).join(',')])

  usePullDownRefresh(() => {
    setPage(1)
    Promise.all([fetchCategories(), fetchPage(1, false)]).then(() => Taro.stopPullDownRefresh())
  })

  const loadMore = () => {
    if (loadingMore || items.length >= total) return
    const next = page + 1
    setPage(next)
    fetchPage(next, true)
  }

  const changeCategory = (id: string) => {
    setSelectedCategoryId(id)
    setPage(1)
    fetchPage(1, false, id)
  }

  const goDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/activity/detail/index?id=${id}` })
  }

  const fmtDate = (d: string) => {
    if (!d) return ''
    const dt = new Date(d)
    if (Number.isNaN(dt.getTime())) return ''
    const w = ['日', '一', '二', '三', '四', '五', '六'][dt.getDay()]
    return `${dt.getMonth() + 1}月${dt.getDate()}日（周${w}） ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
  }

  const isEnded = (a: ActivityItem) => {
    if (!a.endTime) return false
    const t = new Date(a.endTime).getTime()
    return !Number.isNaN(t) && Date.now() > t
  }
  const isCheckedIn = (id: number) => checkedInIds.has(id)

  return (
    <ScrollView scrollY style={{ height: '100vh', background: '#F7F6F2' }} onScrollToLower={loadMore}>
      <View style={{ padding: '28rpx 32rpx 0', fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif' }}>
        <Text style={{ fontSize: '34rpx', fontWeight: '700', color: '#18231E', display: 'block', marginBottom: '18rpx' }}>全部活动</Text>
      </View>

      <ScrollView scrollX style={{ whiteSpace: 'nowrap', width: '100%', marginBottom: '22rpx' }}>
        <View style={{ display: 'flex', flexDirection: 'row', gap: '12rpx', padding: '0 32rpx' }}>
          {[{ id: '', name: '全部' } as any, ...categories].map((c) => {
            const active = selectedCategoryId === String(c.id || '')
            return (
              <View key={c.id || 'all'} onClick={() => changeCategory(String(c.id || ''))}
                style={{ flexShrink: 0, padding: '12rpx 24rpx', borderRadius: '999rpx', background: active ? '#2E7D5A' : '#FFFFFF', border: active ? '1rpx solid #2E7D5A' : '1rpx solid #EDE9DF' }}
              >
                <Text style={{ fontSize: '24rpx', color: active ? '#FFFFFF' : '#3A403B', fontWeight: active ? '700' : '500' }}>{c.name}</Text>
              </View>
            )
          })}
        </View>
      </ScrollView>

      {loading && <View style={{ padding: '120rpx 32rpx', textAlign: 'center' }}><Text style={{ color: '#8A9288', fontSize: '28rpx' }}>加载中...</Text></View>}
      {error && !loading && <View style={{ padding: '120rpx 32rpx', textAlign: 'center' }}><Text style={{ display: 'block', fontSize: '30rpx', color: '#333A34' }}>{error}</Text></View>}
      {!loading && !error && items.length === 0 && (
        <View style={{ padding: '130rpx 32rpx', textAlign: 'center' }}>
          <Text style={{ fontSize: '30rpx', color: '#666666', display: 'block' }}>没有活动</Text>
          <Text style={{ fontSize: '26rpx', color: '#8A9288', display: 'block', marginTop: '8rpx' }}>换个主题看看，或等待新活动上线</Text>
        </View>
      )}

      {!loading && !error && items.map((a) => {
        const ended = isEnded(a)
        const checkedIn = isCheckedIn(a.id)
        const cover = activityCover(a)
        return (
          <View key={a.id} onClick={() => goDetail(a.id)}
            style={{ margin: '0 32rpx 24rpx', background: '#FFFFFF', borderRadius: '20rpx', padding: '18rpx', border: '1rpx solid #EDE9DF', boxShadow: '0 8rpx 24rpx rgba(24,35,30,0.06)', display: 'flex', flexDirection: 'row', boxSizing: 'border-box', opacity: ended ? 0.62 : 1, position: 'relative' }}
          >
            {checkedIn && (
              <View style={{ position: 'absolute', top: '16rpx', right: '16rpx', padding: '4rpx 16rpx', background: 'rgba(238,245,239,0.92)', border: '2rpx solid #2E7D5A', borderRadius: '999rpx', zIndex: 2, transform: 'rotate(-6deg)' }}>
                <Text style={{ fontSize: '22rpx', color: '#2E7D5A', fontWeight: '600' }}>已参加</Text>
              </View>
            )}

            <View style={{ width: '182rpx', height: '182rpx', borderRadius: '16rpx', background: PLACEHOLDER_BG, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {cover ? <ImgWithFallback src={cover} style={{ width: '100%', height: '100%' }} /> : <Text style={{ fontSize: '26rpx', color: 'rgba(24,35,30,0.2)', fontWeight: '700' }}>行者</Text>}
            </View>

            <View style={{ flex: 1, minWidth: 0, paddingLeft: '22rpx', display: 'flex', flexDirection: 'column' }}>
              <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', minWidth: 0 }}>
                {a.category?.name ? (
                  <View style={{ flexShrink: 0, padding: '3rpx 12rpx', background: '#EEF5EF', borderRadius: '999rpx', marginRight: '8rpx' }}>
                    <Text style={{ fontSize: '20rpx', color: '#2E7D5A', fontWeight: '600' }}>{a.category.name}</Text>
                  </View>
                ) : null}
                <Text style={{ flex: 1, fontSize: '30rpx', fontWeight: '700', color: ended ? '#8A9288' : '#18231E', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</Text>
              </View>
              {a.description ? (
                <Text style={{ fontSize: '24rpx', color: ended ? '#A6AAA2' : '#3A403B', lineHeight: '1.5', marginTop: '8rpx', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{a.description}</Text>
              ) : null}
              {a.startTime ? (
                <Text style={{ fontSize: '23rpx', color: ended ? '#A6AAA2' : '#666666', lineHeight: '1.4', marginTop: a.description ? '10rpx' : '14rpx' }}>📅 {fmtDate(a.startTime)}</Text>
              ) : null}
              {a.location ? (
                <Text style={{ fontSize: '23rpx', color: ended ? '#A6AAA2' : '#666666', lineHeight: '1.4', marginTop: '6rpx', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {a.location}</Text>
              ) : null}
              {ended && !checkedIn && (
                <View style={{ alignSelf: 'flex-start', marginTop: '8rpx', padding: '4rpx 12rpx', background: '#E9EAE5', borderRadius: '999rpx' }}>
                  <Text style={{ fontSize: '20rpx', color: '#8A9288' }}>已结束</Text>
                </View>
              )}
            </View>
          </View>
        )
      })}

      {loadingMore && <View style={{ padding: '40rpx', textAlign: 'center' }}><Text style={{ color: '#8A9288', fontSize: '26rpx' }}>加载更多...</Text></View>}
      {items.length >= total && items.length > 0 && <View style={{ padding: '40rpx', textAlign: 'center' }}><Text style={{ color: '#A6AAA2', fontSize: '24rpx' }}>— 已展示全部活动 —</Text></View>}
      <View style={{ height: '80rpx' }} />
    </ScrollView>
  )
}
