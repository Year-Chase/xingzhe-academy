import { View, Text, Image, ScrollView, Swiper, SwiperItem } from '@tarojs/components'
import { useState, useEffect, useCallback } from 'react'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { ensureUserId } from '../../utils/user'

import { API_BASE_URL as API } from '../../config/api'

interface ActivityCategory {
  id: string
  name: string
  code: string
  description: string
  icon: string
  count: number
}

interface ActivityCard {
  id: number
  title: string
  description: string
  location: string
  startTime: string
  endTime: string
  capacity: number
  registeredCount: number
  coverImage: string
  imageUrls?: any
  status: string
  price?: number
  category?: { id: string; name: string } | null
}

interface BannerItem {
  id: string
  imageUrl: string
  title: string
  description: string
  jumpType: 'NONE' | 'ACTIVITY' | 'CATEGORY' | 'SERIES'
  jumpValue: string
}

const PAGE_SIZE = 8
const PLACEHOLDER_BG = 'linear-gradient(160deg, #DCE6E2 0%, #BED5C5 30%, #9AB8A8 65%, #789A85 100%)'

function imgUrl(cover: string | undefined): string {
  if (!cover) return ''
  if (cover.startsWith('http')) return cover
  return API + (cover.startsWith('/') ? '' : '/') + cover
}

function ImgWithFallback({ src, style, mode = 'aspectFill' }: { src: string; style: React.CSSProperties; mode?: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return null
  return <Image src={src} mode={mode as any} style={style} onError={() => setFailed(true)} />
}

function fmtDate(d: string) {
  if (!d) return ''
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return ''
  const w = ['日', '一', '二', '三', '四', '五', '六'][dt.getDay()]
  const h = String(dt.getHours()).padStart(2, '0')
  const m = String(dt.getMinutes()).padStart(2, '0')
  return `${dt.getMonth() + 1}月${dt.getDate()}日（周${w}） ${h}:${m}`
}

function activityCover(a: ActivityCard) {
  try {
    const urls = JSON.parse((a as any).imageUrls || 'null')
    if (Array.isArray(urls) && urls.length > 0) return imgUrl(urls[0])
  } catch {}
  return imgUrl(a.coverImage)
}

function ActivityCardView({ activity, onClick }: { activity: ActivityCard; onClick: () => void }) {
  const cover = activityCover(activity)
  return (
    <View onClick={onClick}
      style={{ margin: '0 32rpx 24rpx', background: '#FFFFFF', borderRadius: '20rpx', overflow: 'hidden', border: '1rpx solid #EDE9DF', boxShadow: '0 8rpx 24rpx rgba(24,35,30,0.06)' }}
    >
      <View style={{ width: '100%', height: '380rpx', background: PLACEHOLDER_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {cover ? (
          <ImgWithFallback src={cover} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Text style={{ fontSize: '48rpx', color: 'rgba(24,35,30,0.12)' }}>行者学社</Text>
        )}
      </View>
      <View style={{ padding: '24rpx 28rpx' }}>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12rpx' }}>
          {activity.category?.name ? (
            <View style={{ flexShrink: 0, padding: '4rpx 14rpx', borderRadius: '999rpx', background: '#EEF5EF' }}>
              <Text style={{ fontSize: '21rpx', color: '#2E7D5A', fontWeight: '600' }}>{activity.category.name}</Text>
            </View>
          ) : null}
          <Text style={{ flex: 1, minWidth: 0, fontSize: '30rpx', fontWeight: '700', color: '#18231E', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.title}</Text>
        </View>
        {activity.description ? (
          <Text style={{ fontSize: '24rpx', color: '#3A403B', lineHeight: '1.5', marginTop: '10rpx', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{activity.description}</Text>
        ) : null}
        <View style={{ marginTop: '16rpx', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            {activity.startTime ? (
              <Text style={{ fontSize: '24rpx', color: '#666666', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fmtDate(activity.startTime)}</Text>
            ) : null}
            {activity.location ? (
              <Text style={{ fontSize: '23rpx', color: '#8A9288', lineHeight: '1.4', marginTop: '4rpx', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.location}</Text>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  )
}

export default function Index() {
  const [activities, setActivities] = useState<ActivityCard[]>([])
  const [categories, setCategories] = useState<ActivityCategory[]>([])
  const [banners, setBanners] = useState<BannerItem[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchCategories = useCallback(async () => {
    try {
      const res = await Taro.request({ url: `${API}/activity/categories`, timeout: 15000 })
      setCategories(Array.isArray(res.data) ? res.data as ActivityCategory[] : [])
    } catch {
      setCategories([])
    }
  }, [])

  const fetchBanners = useCallback(async () => {
    try {
      const res = await Taro.request({ url: `${API}/banner/active`, timeout: 15000 })
      setBanners(Array.isArray(res.data) ? res.data as BannerItem[] : [])
    } catch {
      setBanners([])
    }
  }, [])

  const fetchPage = useCallback(async (p: number, append: boolean, categoryId = selectedCategoryId) => {
    if (append) setLoadingMore(true); else setLoading(true)
    setError('')
    try {
      const categoryQuery = categoryId ? `&categoryId=${encodeURIComponent(categoryId)}` : ''
      const res = await Taro.request({ url: `${API}/activity/all?page=${p}&limit=${PAGE_SIZE}&ongoing=true${categoryQuery}`, timeout: 15000 })
      const data = res.data as any
      let list: ActivityCard[] = []
      if (Array.isArray(data)) list = data
      else if (data && Array.isArray(data.items)) list = data.items
      else if (data && data.data && Array.isArray(data.data.items)) list = data.data.items
      if (append) setActivities((prev) => [...prev, ...list])
      else setActivities(list)
      setHasMore(list.length === PAGE_SIZE)
    } catch (e: any) {
      const msg = e?.errMsg || e?.message || ''
      const isLocal = API.indexOf('127.0.0.1') !== -1 || API.indexOf('localhost') !== -1
      if (isLocal) {
        setError('无法连接本地后端。\n请确认：① 后端已启动在 127.0.0.1:3000\n② 微信开发者工具已勾选"不校验合法域名"')
      } else {
        setError(msg || '加载失败')
      }
    }
    finally { setLoadingMore(false); setLoading(false) }
  }, [selectedCategoryId])

  useEffect(() => {
    ensureUserId(false)
    fetchBanners()
    fetchCategories()
    fetchPage(1, false, '')
  }, [])

  usePullDownRefresh(() => {
    setPage(1)
    setHasMore(true)
    ensureUserId(false)
    Promise.all([fetchBanners(), fetchCategories(), fetchPage(1, false)]).then(() => Taro.stopPullDownRefresh())
  })

  useDidShow(() => {
    ensureUserId(false)
    const dirtyId = Taro.getStorageSync('dirtyActivityId')
    if (!dirtyId) return
    Taro.removeStorageSync('dirtyActivityId')
    Taro.request({ url: `${API}/activity/${dirtyId}` })
      .then((res) => {
        const latest = res.data as any
        setActivities((prev) =>
          prev.map((a) => a.id === latest.id ? { ...a, registeredCount: latest.registeredCount ?? a.registeredCount } : a)
        )
      })
      .catch(() => {})
  })

  const loadMore = () => {
    if (loadingMore || !hasMore) return
    const next = page + 1
    setPage(next)
    fetchPage(next, true)
  }

  const changeCategory = (id: string) => {
    setSelectedCategoryId(id)
    setPage(1)
    setHasMore(true)
    fetchPage(1, false, id)
  }

  const goDetail = (id: number) => { Taro.navigateTo({ url: `/pages/activity/detail/index?id=${id}` }) }
  const goAll = (categoryId?: string) => {
    const suffix = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : ''
    Taro.navigateTo({ url: `/pages/activity/list/index${suffix}` })
  }
  const onBannerTap = (banner: BannerItem) => {
    if (banner.jumpType === 'ACTIVITY' && banner.jumpValue) {
      Taro.navigateTo({ url: `/pages/activity/detail/index?id=${banner.jumpValue}` })
    } else if (banner.jumpType === 'CATEGORY' && banner.jumpValue) {
      goAll(banner.jumpValue)
    }
  }

  const fallbackBanner = (
    <View style={{ margin: '0 32rpx 36rpx', height: '260rpx', borderRadius: '20rpx', overflow: 'hidden', background: '#EEF5EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ textAlign: 'center' }}>
        <Text style={{ fontSize: '34rpx', fontWeight: '700', color: '#18231E', display: 'block', lineHeight: '1.35' }}>在城市边界</Text>
        <Text style={{ fontSize: '34rpx', fontWeight: '700', color: '#18231E', display: 'block', lineHeight: '1.35' }}>找到你的山野</Text>
        <Text style={{ fontSize: '24rpx', color: '#8A9288', display: 'block', marginTop: '12rpx' }}>发现自然 · 认识同路人 · 一起出发</Text>
      </View>
    </View>
  )

  return (
    <ScrollView scrollY style={{ height: '100vh', background: '#F7F6F2' }} onScrollToLower={loadMore}>
      <View style={{ padding: '36rpx 32rpx 28rpx' }}>
        <Text style={{ fontSize: '44rpx', fontWeight: '700', color: '#18231E', display: 'block', lineHeight: '1.25' }}>行者学社</Text>
        <Text style={{ fontSize: '26rpx', color: '#666666', fontWeight: '400', display: 'block', marginTop: '8rpx' }}>把身体从屏幕里带出来</Text>
      </View>

      {banners.length > 0 ? (
        <Swiper indicatorDots autoplay circular style={{ height: '260rpx', margin: '0 32rpx 36rpx', borderRadius: '20rpx', overflow: 'hidden' }}>
          {banners.map((b) => (
            <SwiperItem key={b.id}>
              <View onClick={() => onBannerTap(b)} style={{ height: '260rpx', borderRadius: '20rpx', overflow: 'hidden', position: 'relative', background: '#DCE6E2' }}>
                <ImgWithFallback src={imgUrl(b.imageUrl)} style={{ width: '100%', height: '100%' }} />
                <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '44rpx 28rpx 24rpx', background: 'linear-gradient(0deg, rgba(24,35,30,0.72), rgba(24,35,30,0))' }}>
                  <Text style={{ color: '#FFFFFF', fontSize: '32rpx', fontWeight: '700', display: 'block', lineHeight: '1.3' }}>{b.title}</Text>
                  {b.description ? <Text style={{ color: 'rgba(255,255,255,0.86)', fontSize: '23rpx', display: 'block', marginTop: '6rpx', lineHeight: '1.4' }}>{b.description}</Text> : null}
                </View>
              </View>
            </SwiperItem>
          ))}
        </Swiper>
      ) : fallbackBanner}

      <View style={{ padding: '0 32rpx 18rpx', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: '32rpx', fontWeight: '700', color: '#18231E' }}>主题活动</Text>
        <Text onClick={() => goAll(selectedCategoryId || undefined)} style={{ fontSize: '24rpx', color: '#2E7D5A' }}>查看更多</Text>
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

      {loading && (<View style={{ padding: '80rpx 32rpx', textAlign: 'center' }}><Text style={{ color: '#8A9288', fontSize: '28rpx' }}>加载中...</Text></View>)}
      {error && !loading && (
        <View style={{ margin: '0 32rpx', padding: '32rpx', background: '#FFFFFF', borderRadius: '20rpx', border: '1rpx solid #EDE9DF', textAlign: 'center' }}>
          <Text style={{ fontSize: '26rpx', color: '#B35B4B', display: 'block', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{error}</Text>
        </View>
      )}
      {!loading && !error && activities.length === 0 && (
        <View style={{ padding: '86rpx 32rpx', textAlign: 'center' }}>
          <Text style={{ fontSize: '30rpx', color: '#666666', display: 'block' }}>没有活动</Text>
          <Text style={{ fontSize: '26rpx', color: '#8A9288', display: 'block', marginTop: '8rpx' }}>换个主题看看，或等待新活动上线</Text>
        </View>
      )}

      {activities.map((a) => (
        <ActivityCardView key={a.id} activity={a} onClick={() => goDetail(a.id)} />
      ))}

      {loadingMore && <View style={{ padding: '40rpx', textAlign: 'center' }}><Text style={{ color: '#8A9288', fontSize: '26rpx' }}>加载更多...</Text></View>}
      {!hasMore && activities.length > 0 && <View style={{ padding: '40rpx', textAlign: 'center' }}><Text style={{ color: '#A6AAA2', fontSize: '24rpx' }}>— 已展示全部活动 —</Text></View>}

      <View style={{ height: '56rpx' }} />
    </ScrollView>
  )
}
