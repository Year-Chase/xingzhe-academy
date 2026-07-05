import { View, Text, Image } from '@tarojs/components'
import { useState, useEffect, useCallback } from 'react'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { ensureUserId } from '../../utils/user'

import { API_BASE_URL as API } from '../../config/api'

interface ActivityCard {
  id: number; title: string; description: string; location: string
  startTime: string; endTime: string; capacity: number; registeredCount: number
  coverImage: string; imageUrls?: any; status: string; price?: number
}

const PAGE_SIZE = 10
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
  if (!d) return ''; const dt = new Date(d)
  const w = ['日', '一', '二', '三', '四', '五', '六'][dt.getDay()]
  const h = String(dt.getHours()).padStart(2, '0')
  const m = String(dt.getMinutes()).padStart(2, '0')
  return `${dt.getMonth() + 1}月${dt.getDate()}日（周${w}） ${h}:${m}`
}

export default function Index() {
  const [activities, setActivities] = useState<ActivityCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchPage = useCallback(async (p: number, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true)
    setError('')
    try {
      const res = await Taro.request({ url: `${API}/activity/all?page=${p}&limit=${PAGE_SIZE}&ongoing=true`, timeout: 15000 })
      const data = res.data as any
      // Compatible with: plain array, { items }, { data: { items } }
      let list: ActivityCard[] = []
      if (Array.isArray(data)) {
        list = data
      } else if (data && Array.isArray(data.items)) {
        list = data.items
      } else if (data && data.data && Array.isArray(data.data.items)) {
        list = data.data.items
      }
      if (append) setActivities((prev) => [...prev, ...list])
      else setActivities(list)
      setHasMore(list.length === PAGE_SIZE)
    } catch (e: any) {
      const msg = e?.errMsg || e?.message || ''
      const isLocal = API.indexOf('127.0.0.1') !== -1 || API.indexOf('localhost') !== -1
      if (isLocal) {
        setError('无法连接本地后端。\n请确认：① 后端已启动在 127.0.0.1:3000\n② 微信开发者工具已勾选"不校验合法域名"')
      } else {
        setError('加载失败')
      }
    }
    finally { setLoadingMore(false); setLoading(false) }
  }, [])

  useEffect(() => { ensureUserId(false); fetchPage(1, false) }, [])

  // Pull-down refresh
  usePullDownRefresh(() => {
    setPage(1)
    setHasMore(true)
    ensureUserId(false)
    fetchPage(1, false).then(() => Taro.stopPullDownRefresh())
  })

  // onShow: update registeredCount for dirty activities
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

  const goDetail = (id: number) => { Taro.navigateTo({ url: `/pages/activity/detail/index?id=${id}` }) }
  const goAll = () => { Taro.navigateTo({ url: '/pages/activity/list/index' }) }

  return (
    <View style={{ minHeight: '100vh', background: '#F7F6F2' }}>
      <View style={{ padding: '36rpx 32rpx 28rpx' }}>
        <Text style={{ fontSize: '44rpx', fontWeight: '700', color: '#18231E', display: 'block', lineHeight: '1.25' }}>行者学社</Text>
        <Text style={{ fontSize: '26rpx', color: '#666666', fontWeight: '400', display: 'block', marginTop: '8rpx' }}>把身体从屏幕里带出来</Text>
      </View>

      <View style={{ margin: '0 32rpx 36rpx', height: '240rpx', borderRadius: '24rpx', overflow: 'hidden', background: '#EEF5EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ textAlign: 'center' }}>
          <Text style={{ fontSize: '34rpx', fontWeight: '700', color: '#18231E', display: 'block', lineHeight: '1.35' }}>在城市边界</Text>
          <Text style={{ fontSize: '34rpx', fontWeight: '700', color: '#18231E', display: 'block', lineHeight: '1.35' }}>找到你的山野</Text>
          <Text style={{ fontSize: '24rpx', color: '#8A9288', display: 'block', marginTop: '12rpx' }}>发现自然 · 认识同路人 · 一起出发</Text>
        </View>
      </View>

      <View style={{ padding: '0 32rpx 20rpx', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: '34rpx', fontWeight: '700', color: '#18231E' }}>行者活动</Text>
        <Text onClick={goAll} style={{ fontSize: '24rpx', color: '#2E7D5A' }}>全部活动 →</Text>
      </View>

      {loading && (<View style={{ padding: '100rpx 32rpx', textAlign: 'center' }}><Text style={{ color: '#8A9288', fontSize: '28rpx' }}>加载中...</Text></View>)}
      {error && !loading && (
        <View style={{ margin: '0 32rpx', padding: '32rpx', background: '#FFFFFF', borderRadius: '24rpx', border: '1rpx solid #EDE9DF', textAlign: 'center' }}>
          <Text style={{ fontSize: '26rpx', color: '#B35B4B', display: 'block', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{error}</Text>
        </View>
      )}
      {!loading && !error && activities.length === 0 && (
        <View style={{ padding: '100rpx 32rpx', textAlign: 'center' }}>
          <Text style={{ fontSize: '60rpx', display: 'block', marginBottom: '16rpx' }}>🏃</Text>
          <Text style={{ fontSize: '30rpx', color: '#666666', display: 'block' }}>暂无活动</Text>
          <Text style={{ fontSize: '26rpx', color: '#8A9288', display: 'block', marginTop: '8rpx' }}>新活动即将上线，敬请期待</Text>
        </View>
      )}

      {activities.map((a) => {
        const firstImage = (() => {
          try { const urls = JSON.parse((a as any).imageUrls || 'null'); if (Array.isArray(urls) && urls.length > 0) return urls[0] } catch {}
          return null
        })()
        const cover = imgUrl(firstImage || a.coverImage)
        return (
          <View key={a.id} onClick={() => goDetail(a.id)}
            style={{ margin: '0 32rpx 24rpx', background: '#FFFFFF', borderRadius: '24rpx', overflow: 'hidden', border: '1rpx solid #EDE9DF', boxShadow: '0 8rpx 24rpx rgba(24,35,30,0.06)' }}
          >
            {/* Cover — 3:2, full width, top of card */}
            <View style={{ width: '100%', height: '400rpx', background: PLACEHOLDER_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {cover ? (
                <ImgWithFallback src={cover} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text style={{ fontSize: '48rpx', color: 'rgba(24,35,30,0.12)' }}>行者学社</Text>
              )}
            </View>
            {/* Text area */}
            <View style={{ padding: '24rpx 28rpx' }}>
              <Text style={{ fontSize: '30rpx', fontWeight: '700', color: '#18231E', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</Text>
              {a.description ? (
                <Text style={{ fontSize: '24rpx', color: '#3A403B', lineHeight: '1.5', marginTop: '8rpx', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{a.description}</Text>
              ) : null}
              {/* Info row */}
              <View style={{ marginTop: '16rpx', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  {a.startTime ? (
                    <Text style={{ fontSize: '24rpx', color: '#666666', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fmtDate(a.startTime)}</Text>
                  ) : null}
                  {a.location ? (
                    <Text style={{ fontSize: '23rpx', color: '#8A9288', lineHeight: '1.4', marginTop: '4rpx', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.location}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          </View>
        )
      })}

      {loadingMore && <View style={{ padding: '40rpx', textAlign: 'center' }}><Text style={{ color: '#8A9288', fontSize: '26rpx' }}>加载更多...</Text></View>}
      {!hasMore && activities.length > 0 && <View style={{ padding: '40rpx', textAlign: 'center' }}><Text style={{ color: '#A6AAA2', fontSize: '24rpx' }}>— 已展示全部活动 —</Text></View>}

      <View style={{ height: '56rpx' }} />
    </View>
  )
}
