import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
import { API_BASE_URL as API } from '../../../config/api'

interface ActivitySeries {
  id: string
  name: string
  code: string
  coverImage: string
  shortDescription: string
  sortOrder: number
}

const C = {
  bg: '#F7F6F2',
  white: '#FFFFFF',
  green: '#3F6B4F',
  dark: '#18231E',
  neutral: '#7A8178',
  border: '#EDE9DF',
}
const PLACEHOLDER_BG = 'linear-gradient(160deg, #DCE6E2 0%, #BED5C5 30%, #9AB8A8 65%, #789A85 100%)'

function imgUrl(cover: string | undefined): string {
  if (!cover) return ''
  if (cover.startsWith('http')) return cover
  return API + (cover.startsWith('/') ? '' : '/') + cover
}

function ImgWithFallback({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return null
  return <Image src={src} mode="aspectFill" style={{ width: '100%', height: '100%' }} onError={() => setFailed(true)} />
}

export default function ActivitySeriesIndex() {
  const [list, setList] = useState<ActivitySeries[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await Taro.request({ url: `${API}/activity/series`, timeout: 15000 })
      setList(Array.isArray(res.data) ? res.data as ActivitySeries[] : [])
    } catch (_e) {
      setError('加载失败，请下拉重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  usePullDownRefresh(() => { load().then(() => Taro.stopPullDownRefresh()) })

  return (
    <ScrollView scrollY style={{ height: '100vh', background: C.bg }}>
      <View style={{ padding: '24rpx 32rpx 80rpx' }}>
        {loading ? (
          <View style={{ padding: '100rpx 0', textAlign: 'center' }}>
            <Text style={{ fontSize: '28rpx', color: C.neutral }}>正在加载...</Text>
          </View>
        ) : null}
        {error && !loading ? (
          <View style={{ padding: '56rpx 28rpx', background: C.white, borderRadius: '20rpx', border: `1rpx solid ${C.border}`, textAlign: 'center' }}>
            <Text style={{ fontSize: '28rpx', color: C.neutral }}>{error}</Text>
          </View>
        ) : null}
        {!loading && !error ? list.map((s) => (
          <View key={s.id} onClick={() => Taro.navigateTo({ url: `/pages/activity/series/detail/index?id=${s.id}` })}
            style={{ marginBottom: '24rpx', background: C.white, borderRadius: '22rpx', border: `1rpx solid ${C.border}`, overflow: 'hidden' }}
          >
            <View style={{ width: '100%', height: '514rpx', background: PLACEHOLDER_BG, overflow: 'hidden' }}>
              <ImgWithFallback src={imgUrl(s.coverImage)} />
            </View>
            <View style={{ padding: '24rpx 26rpx' }}>
              <Text style={{ fontSize: '34rpx', color: C.dark, fontWeight: '700', lineHeight: '1.3', display: 'block' }}>{s.name}</Text>
              {s.shortDescription ? (
                <Text style={{ fontSize: '25rpx', color: C.neutral, lineHeight: '1.5', marginTop: '10rpx', display: 'block' }}>{s.shortDescription}</Text>
              ) : null}
            </View>
          </View>
        )) : null}
      </View>
    </ScrollView>
  )
}
