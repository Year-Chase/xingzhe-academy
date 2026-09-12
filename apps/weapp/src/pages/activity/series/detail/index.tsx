import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro, { usePullDownRefresh, useRouter } from '@tarojs/taro'
import { API_BASE_URL as API } from '../../../../config/api'
import { isLoggedIn, userAuthHeader } from '../../../../utils/user'
import { ActivityCard as UnifiedActivityCard } from '../../../../components/activity-card'

interface ActivityCard {
  id: number
  title: string
  description: string
  externalUrl?: string
  location: string
  startTime: string
  endTime: string
  coverImage: string
  imageUrls?: any
  category?: { id: string; name: string } | null
  series?: { id: string; name: string } | null
  userActivityState?: string
  activityTemporalState?: string
}

interface SeriesDetail {
  id: string
  name: string
  code: string
  coverImage: string
  shortDescription: string
  description: string
  status: 'ACTIVE' | 'INACTIVE'
  activeActivities: ActivityCard[]
  pastActivities: ActivityCard[]
}

const C = {
  bg: '#F7F8F5',
  white: '#FFFFFF',
  green: '#2E7D5A',
  dark: '#202923',
  body: '#4B564F',
  neutral: '#747D77',
  secondary: '#A3AAA5',
  lightGreen: '#EEF6F1',
  border: '#E6EAE6',
}
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

function SeriesActivityCard({ activity, past = false }: { activity: ActivityCard; past?: boolean }) {
  return <UnifiedActivityCard activity={activity} faded={past} edgeMargin='0' />
}

export default function ActivitySeriesDetail() {
  const router = useRouter()
  const id = String(router.params?.id || '')
  const [detail, setDetail] = useState<SeriesDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    if (!id) { setError('行者系列不存在'); setLoading(false); return }
    setLoading(true)
    setError('')
    try {
      const res = await Taro.request({ url: `${API}/activity/series/${encodeURIComponent(id)}`, header: isLoggedIn() ? userAuthHeader() : undefined, timeout: 15000 })
      setDetail(res.data as SeriesDetail)
    } catch (_e) {
      setError('加载失败，请下拉重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])
  usePullDownRefresh(() => { load().then(() => Taro.stopPullDownRefresh()) })

  if (loading) return <View style={fullCenter}><Text style={{ fontSize: '28rpx', color: C.secondary }}>正在打开行者系列...</Text></View>
  if (error || !detail) {
    return (
      <View style={{ ...fullCenter, flexDirection: 'column', padding: '48rpx' }}>
        <Text style={{ fontSize: '32rpx', fontWeight: '700', color: C.dark, marginBottom: '12rpx' }}>行者系列暂时没有打开</Text>
        <Text style={{ fontSize: '26rpx', color: C.neutral, marginBottom: '32rpx' }}>{error || '请稍后再试'}</Text>
        <View onClick={load} style={button}><Text style={{ fontSize: '28rpx', color: '#FFFFFF' }}>重新加载</Text></View>
      </View>
    )
  }

  return (
    <ScrollView scrollY style={{ height: '100vh', background: C.bg }}>
      <View style={{ padding: '24rpx 0 80rpx' }}>
        <View style={{ margin: '0 24rpx', aspectRatio: '4 / 3', borderRadius: '24rpx', overflow: 'hidden', background: PLACEHOLDER_BG, position: 'relative' }}>
          <ImgWithFallback src={imgUrl(detail.coverImage)} style={{ width: '100%', height: '100%' }} />
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '84rpx 30rpx 28rpx', background: 'linear-gradient(0deg, rgba(0,0,0,0.55), rgba(0,0,0,0))' }}>
            <Text style={{ color: '#FFFFFF', fontSize: '36rpx', fontWeight: '600', display: 'block', lineHeight: '1.25' }}>{detail.name}</Text>
            {detail.shortDescription ? <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '25rpx', display: 'block', marginTop: '8rpx', lineHeight: '1.45', maxHeight: '72rpx', overflow: 'hidden' }}>{detail.shortDescription}</Text> : null}
          </View>
        </View>

        {detail.description ? (
          <View style={{ margin: '24rpx 24rpx 0', background: C.white, borderRadius: '22rpx', border: `1rpx solid ${C.border}`, padding: '24rpx 28rpx' }}>
            <Text style={{ fontSize: '30rpx', fontWeight: '600', color: C.dark, display: 'block', marginBottom: '14rpx' }}>品牌介绍</Text>
            <Text style={{ fontSize: '27rpx', color: C.body, lineHeight: '1.65', display: 'block' }}>{detail.description}</Text>
          </View>
        ) : null}
        {detail.externalUrl ? (
          <View onClick={() => Taro.navigateTo({ url: `/pages/web-view/index?url=${encodeURIComponent(detail.externalUrl || '')}` })} style={{ margin: '16rpx 24rpx 0', height: '78rpx', padding: '0 28rpx', background: C.white, borderRadius: '22rpx', border: `1rpx solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: '25rpx', color: C.green, fontWeight: '500' }}>访问品牌官网</Text><Text style={{ fontSize: '24rpx', color: C.secondary }}>&gt;</Text>
          </View>
        ) : null}

        {(detail.activeActivities.length > 0 || detail.pastActivities.length > 0) ? (
          <View style={{ margin: '32rpx 24rpx 0' }}>
            <Text style={{ fontSize: '32rpx', fontWeight: '600', color: C.dark, display: 'block', marginBottom: '18rpx' }}>系列活动</Text>
            {detail.activeActivities.map((a) => <SeriesActivityCard key={a.id} activity={a} />)}
            {detail.pastActivities.map((a) => <SeriesActivityCard key={a.id} activity={a} past />)}
          </View>
        ) : null}

        {detail.activeActivities.length === 0 && detail.pastActivities.length === 0 ? (
          <View style={{ margin: '32rpx 24rpx', padding: '56rpx 28rpx', background: C.white, borderRadius: '22rpx', border: `1rpx solid ${C.border}`, textAlign: 'center' }}>
            <Text style={{ fontSize: '28rpx', color: C.neutral }}>这个系列的活动正在准备中</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  )
}

const fullCenter: React.CSSProperties = { minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const button: React.CSSProperties = { padding: '16rpx 48rpx', background: C.green, borderRadius: '999rpx', display: 'flex', alignItems: 'center', justifyContent: 'center' }
