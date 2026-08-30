import { View, Text, Image, ScrollView, Swiper, SwiperItem } from '@tarojs/components'
import { useState, useEffect, useCallback } from 'react'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { ensureUserId } from '../../utils/user'

import { API_BASE_URL as API } from '../../config/api'

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
  series?: { id: string; name: string } | null
}

interface ActivitySeries {
  id: string
  name: string
  code: string
  coverImage: string
  shortDescription: string
  sortOrder: number
}

interface BannerItem {
  id: string
  imageUrl: string
  title: string
  description: string
  jumpType: 'NONE' | 'ACTIVITY' | 'CATEGORY' | 'SERIES'
  jumpValue: string
}

const RECENT_LIMIT = 5
const BANNER_HEIGHT = '312rpx'
const HOME_SERIES_LIMIT = 4
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
  const meta = [activity.startTime ? fmtDate(activity.startTime) : '', activity.location || ''].filter(Boolean).join('  ')
  return (
    <View onClick={onClick}
      style={{ margin: '0 32rpx 18rpx', background: '#FFFFFF', borderRadius: '18rpx', overflow: 'hidden', border: '1rpx solid #EDE9DF', display: 'flex', flexDirection: 'row', minHeight: '172rpx' }}
    >
      <View style={{ width: '172rpx', height: '172rpx', flexShrink: 0, background: PLACEHOLDER_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {cover ? (
          <ImgWithFallback src={cover} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Text style={{ fontSize: '28rpx', color: 'rgba(24,35,30,0.12)' }}>行者</Text>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0, padding: '18rpx 22rpx', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10rpx' }}>
          {activity.series?.name ? (
            <View style={{ flexShrink: 0, padding: '4rpx 14rpx', borderRadius: '999rpx', background: '#EEF5EF' }}>
              <Text style={{ fontSize: '21rpx', color: '#2E7D5A', fontWeight: '600' }}>{activity.series.name}</Text>
            </View>
          ) : activity.category?.name ? (
            <View style={{ flexShrink: 0, padding: '4rpx 14rpx', borderRadius: '999rpx', background: '#EEF5EF' }}>
              <Text style={{ fontSize: '21rpx', color: '#2E7D5A', fontWeight: '600' }}>{activity.category.name}</Text>
            </View>
          ) : null}
          <Text style={{ flex: 1, minWidth: 0, fontSize: '29rpx', fontWeight: '700', color: '#18231E', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.title}</Text>
        </View>
        {activity.description ? (
          <Text style={{ fontSize: '23rpx', color: '#3A403B', lineHeight: '1.45', marginTop: '8rpx', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{activity.description}</Text>
        ) : null}
        <View style={{ marginTop: '12rpx', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            {meta ? (
              <Text style={{ fontSize: '24rpx', color: '#666666', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta}</Text>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  )
}

export default function Index() {
  const [activities, setActivities] = useState<ActivityCard[]>([])
  const [seriesList, setSeriesList] = useState<ActivitySeries[]>([])
  const [banners, setBanners] = useState<BannerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchSeries = useCallback(async () => {
    try {
      const res = await Taro.request({ url: `${API}/activity/series`, timeout: 15000 })
      setSeriesList(Array.isArray(res.data) ? res.data as ActivitySeries[] : [])
    } catch {
      setSeriesList([])
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

  const fetchRecent = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await Taro.request({ url: `${API}/activity/recent?limit=${RECENT_LIMIT}`, timeout: 15000 })
      const data = res.data as any
      let list: ActivityCard[] = []
      if (Array.isArray(data)) list = data
      else if (data && Array.isArray(data.items)) list = data.items
      else if (data && data.data && Array.isArray(data.data.items)) list = data.data.items
      setActivities(list.slice(0, RECENT_LIMIT))
    } catch (e: any) {
      const msg = e?.errMsg || e?.message || ''
      const isLocal = API.indexOf('127.0.0.1') !== -1 || API.indexOf('localhost') !== -1
      if (isLocal) {
        setError('无法连接本地后端。\n请确认：① 后端已启动在 127.0.0.1:3000\n② 微信开发者工具已勾选"不校验合法域名"')
      } else {
        setError(msg || '加载失败')
      }
    }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    ensureUserId(false)
    fetchBanners()
    fetchSeries()
    fetchRecent()
  }, [])

  usePullDownRefresh(() => {
    ensureUserId(false)
    Promise.all([fetchBanners(), fetchSeries(), fetchRecent()]).then(() => Taro.stopPullDownRefresh())
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

  const goDetail = (id: number) => { Taro.navigateTo({ url: `/pages/activity/detail/index?id=${id}` }) }
  const goAll = (categoryId?: string) => {
    const suffix = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : ''
    Taro.navigateTo({ url: `/pages/activity/list/index${suffix}` })
  }
  const goSeries = (id: string) => { Taro.navigateTo({ url: `/pages/activity/series/detail/index?id=${id}` }) }
  const goSeriesIndex = () => { Taro.navigateTo({ url: '/pages/activity/series/index' }) }
  const onBannerTap = (banner: BannerItem) => {
    if (banner.jumpType === 'ACTIVITY' && banner.jumpValue) {
      Taro.navigateTo({ url: `/pages/activity/detail/index?id=${banner.jumpValue}` })
    } else if (banner.jumpType === 'CATEGORY' && banner.jumpValue) {
      goAll(banner.jumpValue)
    } else if (banner.jumpType === 'SERIES' && banner.jumpValue) {
      goSeries(banner.jumpValue)
    }
  }

  const renderSeriesCard = (s: ActivitySeries) => {
    const wide = seriesList.length === 1
    return (
      <View key={s.id} onClick={() => goSeries(s.id)}
        style={{
          flexShrink: 0,
          width: wide ? '686rpx' : '320rpx',
          borderRadius: '22rpx',
          background: '#FFFFFF',
          border: '1rpx solid #EDE9DF',
          overflow: 'hidden',
          boxShadow: '0 8rpx 24rpx rgba(24,35,30,0.05)',
        }}
      >
        <View style={{ height: wide ? '514rpx' : '240rpx', background: PLACEHOLDER_BG, overflow: 'hidden' }}>
          <ImgWithFallback src={imgUrl(s.coverImage)} style={{ width: '100%', height: '100%' }} />
        </View>
        <View style={{ padding: '20rpx 22rpx' }}>
          <Text style={{ fontSize: '30rpx', color: '#18231E', fontWeight: '700', lineHeight: '1.3', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</Text>
          {s.shortDescription ? (
            <Text style={{ fontSize: '23rpx', color: '#8A9288', lineHeight: '1.45', marginTop: '8rpx', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.shortDescription}</Text>
          ) : null}
        </View>
      </View>
    )
  }

  const fallbackBanner = (
    <View style={{ margin: '24rpx 32rpx 34rpx', height: BANNER_HEIGHT, borderRadius: '28rpx', overflow: 'hidden', background: '#EEF5EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ textAlign: 'center' }}>
        <Text style={{ fontSize: '34rpx', fontWeight: '700', color: '#18231E', display: 'block', lineHeight: '1.35' }}>在城市边界</Text>
        <Text style={{ fontSize: '34rpx', fontWeight: '700', color: '#18231E', display: 'block', lineHeight: '1.35' }}>找到你的山野</Text>
        <Text style={{ fontSize: '24rpx', color: '#8A9288', display: 'block', marginTop: '12rpx' }}>发现自然 · 认识同路人 · 一起出发</Text>
      </View>
    </View>
  )

  return (
    <ScrollView scrollY style={{ height: '100vh', background: '#F7F6F2' }}>
      {banners.length > 0 ? (
        <Swiper indicatorDots autoplay circular style={{ height: BANNER_HEIGHT, margin: '24rpx 32rpx 34rpx', borderRadius: '28rpx', overflow: 'hidden' }}>
          {banners.map((b) => (
            <SwiperItem key={b.id}>
              <View onClick={() => onBannerTap(b)} style={{ height: BANNER_HEIGHT, borderRadius: '28rpx', overflow: 'hidden', position: 'relative', background: '#DCE6E2' }}>
                <ImgWithFallback src={imgUrl(b.imageUrl)} style={{ width: '100%', height: '100%' }} />
                <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '64rpx 30rpx 28rpx', background: 'linear-gradient(0deg, rgba(24,35,30,0.76), rgba(24,35,30,0))' }}>
                  <Text style={{ color: '#FFFFFF', fontSize: '32rpx', fontWeight: '700', display: 'block', lineHeight: '1.3' }}>{b.title}</Text>
                  {b.description ? <Text style={{ color: 'rgba(255,255,255,0.86)', fontSize: '23rpx', display: 'block', marginTop: '6rpx', lineHeight: '1.4' }}>{b.description}</Text> : null}
                </View>
              </View>
            </SwiperItem>
          ))}
        </Swiper>
      ) : fallbackBanner}

      {seriesList.length > 0 ? (
        <>
          <View style={{ padding: '0 32rpx 18rpx', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: '32rpx', fontWeight: '700', color: '#18231E' }}>行者系列</Text>
            {seriesList.length >= 5 ? <Text onClick={goSeriesIndex} style={{ fontSize: '24rpx', color: '#2E7D5A' }}>查看全部系列 →</Text> : null}
          </View>
          <ScrollView scrollX={seriesList.length > 1} style={{ whiteSpace: 'nowrap', width: '100%', marginBottom: '32rpx' }}>
            <View style={{ display: 'flex', flexDirection: 'row', gap: '16rpx', padding: '0 32rpx' }}>
              {seriesList.slice(0, HOME_SERIES_LIMIT).map(renderSeriesCard)}
            </View>
          </ScrollView>
        </>
      ) : null}

      <View style={{ padding: '0 32rpx 18rpx', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: '32rpx', fontWeight: '700', color: '#18231E' }}>近期活动</Text>
      </View>

      {loading && (<View style={{ padding: '80rpx 32rpx', textAlign: 'center' }}><Text style={{ color: '#8A9288', fontSize: '28rpx' }}>加载中...</Text></View>)}
      {error && !loading && (
        <View style={{ margin: '0 32rpx', padding: '32rpx', background: '#FFFFFF', borderRadius: '20rpx', border: '1rpx solid #EDE9DF', textAlign: 'center' }}>
          <Text style={{ fontSize: '26rpx', color: '#B35B4B', display: 'block', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{error}</Text>
        </View>
      )}
      {activities.slice(0, RECENT_LIMIT).map((a) => (
        <ActivityCardView key={a.id} activity={a} onClick={() => goDetail(a.id)} />
      ))}

      <View style={{ padding: '16rpx 32rpx 40rpx' }}>
        <View onClick={() => goAll()} style={{ height: '92rpx', borderRadius: '24rpx', background: '#FFFFFF', border: '1rpx solid #E1DED5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: '28rpx', color: '#2E7D5A', fontWeight: '600' }}>查看更多活动 →</Text>
        </View>
      </View>

      <View style={{ height: '56rpx' }} />
    </ScrollView>
  )
}
