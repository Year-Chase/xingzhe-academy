import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro, { usePullDownRefresh, useRouter } from '@tarojs/taro'
import { API_BASE_URL as API } from '../../../../config/api'

interface ActivityCard {
  id: number
  title: string
  description: string
  location: string
  startTime: string
  endTime: string
  coverImage: string
  imageUrls?: any
  category?: { id: string; name: string } | null
  series?: { id: string; name: string } | null
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
  bg: '#F7F6F2',
  white: '#FFFFFF',
  green: '#3F6B4F',
  dark: '#18231E',
  body: '#3E463F',
  neutral: '#7A8178',
  secondary: '#A6AAA2',
  lightGreen: '#EEF5EF',
  border: '#EDE9DF',
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

function fmtDate(d: string) {
  if (!d) return ''
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return ''
  const w = ['日', '一', '二', '三', '四', '五', '六'][dt.getDay()]
  return `${dt.getMonth() + 1}月${dt.getDate()}日（周${w}） ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}

function activityCover(a: ActivityCard) {
  try {
    const urls = JSON.parse((a as any).imageUrls || 'null')
    if (Array.isArray(urls) && urls.length > 0) return imgUrl(urls[0])
  } catch {}
  return imgUrl(a.coverImage)
}

function SeriesActivityCard({ activity, past = false }: { activity: ActivityCard; past?: boolean }) {
  const cover = activityCover(activity)
  const meta = [activity.startTime ? fmtDate(activity.startTime) : '', activity.location || ''].filter(Boolean).join('  ')
  return (
    <View onClick={() => Taro.navigateTo({ url: `/pages/activity/detail/index?id=${activity.id}` })}
      style={{ marginBottom: '20rpx', background: C.white, borderRadius: '20rpx', overflow: 'hidden', border: `1rpx solid ${C.border}`, opacity: past ? 0.72 : 1 }}
    >
      <View style={{ height: '300rpx', background: PLACEHOLDER_BG, overflow: 'hidden' }}>
        <ImgWithFallback src={cover} style={{ width: '100%', height: '100%' }} />
      </View>
      <View style={{ padding: '22rpx 24rpx' }}>
        {activity.category?.name ? (
          <View style={{ alignSelf: 'flex-start', padding: '4rpx 14rpx', borderRadius: '999rpx', background: C.lightGreen, marginBottom: '10rpx' }}>
            <Text style={{ fontSize: '21rpx', color: C.green, fontWeight: '600' }}>{activity.category.name}</Text>
          </View>
        ) : null}
        <Text style={{ fontSize: '31rpx', fontWeight: '700', color: C.dark, lineHeight: '1.35', display: 'block' }}>{activity.title}</Text>
        {activity.description ? <Text style={{ fontSize: '24rpx', color: C.body, lineHeight: '1.5', marginTop: '8rpx', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.description}</Text> : null}
        {meta ? <Text style={{ fontSize: '23rpx', color: C.neutral, lineHeight: '1.4', marginTop: '14rpx', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta}</Text> : null}
      </View>
    </View>
  )
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
      const res = await Taro.request({ url: `${API}/activity/series/${encodeURIComponent(id)}`, timeout: 15000 })
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
      <View style={{ paddingBottom: '80rpx' }}>
        <View style={{ margin: '24rpx 32rpx 0', height: '380rpx', borderRadius: '24rpx', overflow: 'hidden', background: PLACEHOLDER_BG, position: 'relative' }}>
          <ImgWithFallback src={imgUrl(detail.coverImage)} style={{ width: '100%', height: '100%' }} />
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '72rpx 30rpx 30rpx', background: 'linear-gradient(0deg, rgba(24,35,30,0.76), rgba(24,35,30,0))' }}>
            <Text style={{ color: '#FFFFFF', fontSize: '42rpx', fontWeight: '700', display: 'block', lineHeight: '1.25' }}>{detail.name}</Text>
            {detail.shortDescription ? <Text style={{ color: 'rgba(255,255,255,0.86)', fontSize: '25rpx', display: 'block', marginTop: '8rpx', lineHeight: '1.45' }}>{detail.shortDescription}</Text> : null}
          </View>
        </View>

        {detail.description ? (
          <View style={{ margin: '24rpx 32rpx 0', background: C.white, borderRadius: '20rpx', border: `1rpx solid ${C.border}`, padding: '26rpx 28rpx' }}>
            <Text style={{ fontSize: '27rpx', color: C.body, lineHeight: '1.65', display: 'block' }}>{detail.description}</Text>
          </View>
        ) : null}

        {detail.activeActivities.length > 0 ? (
          <View style={{ margin: '32rpx 32rpx 0' }}>
            <Text style={{ fontSize: '32rpx', fontWeight: '700', color: C.dark, display: 'block', marginBottom: '18rpx' }}>正在/即将发生</Text>
            {detail.activeActivities.map((a) => <SeriesActivityCard key={a.id} activity={a} />)}
          </View>
        ) : null}

        {detail.pastActivities.length > 0 ? (
          <View style={{ margin: '32rpx 32rpx 0' }}>
            <Text style={{ fontSize: '32rpx', fontWeight: '700', color: C.dark, display: 'block', marginBottom: '18rpx' }}>往期活动</Text>
            {detail.pastActivities.map((a) => <SeriesActivityCard key={a.id} activity={a} past />)}
          </View>
        ) : null}

        {detail.activeActivities.length === 0 && detail.pastActivities.length === 0 ? (
          <View style={{ margin: '32rpx', padding: '56rpx 28rpx', background: C.white, borderRadius: '20rpx', border: `1rpx solid ${C.border}`, textAlign: 'center' }}>
            <Text style={{ fontSize: '28rpx', color: C.neutral }}>这个系列的活动正在准备中</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  )
}

const fullCenter: React.CSSProperties = { minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const button: React.CSSProperties = { padding: '16rpx 48rpx', background: C.green, borderRadius: '999rpx', display: 'flex', alignItems: 'center', justifyContent: 'center' }
