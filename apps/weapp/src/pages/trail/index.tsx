import { View, Text, ScrollView, Image, Swiper, SwiperItem, MovableArea, MovableView } from '@tarojs/components'
import { useState, useEffect, useMemo } from 'react'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { isLoggedIn, userAuthHeader } from '../../utils/user'
import chinaMap from '../../assets/maps/china-map.png'
import { cityPoint } from '../../data/china-city-points'
import { API_BASE_URL as API } from '../../config/api'

const C = { bg: '#F7F8F5', card: '#FFFFFF', ink: '#202923', body: '#4B564F', muted: '#747D77', line: '#E6EAE6', green: '#2E7D5A', softGreen: '#EEF6F1' }
const modWrap: React.CSSProperties = { margin: '24rpx 24rpx 0', background: C.card, borderRadius: '24rpx', padding: '28rpx', border: `1rpx solid ${C.line}` }
const modTitle: React.CSSProperties = { fontSize: '30rpx', fontWeight: '600', color: C.ink, display: 'block', marginBottom: '6rpx' }
const modSub: React.CSSProperties = { fontSize: '23rpx', color: C.muted, display: 'block', marginBottom: '16rpx' }

interface JourneyData {
  userId: string
  profile: { displayName: string; avatarUrl: string; joinedDays: number }
  summary: { registeredCount: number; completedCount: number; checkedInCount: number; provinceCount: number; cityCount: number; companionCount: number; certificateCount: number }
  memories: { memoryImages: any }[]
  certificates: Certificate[]
}
interface Certificate { certificateId: string; activityDate: string; issuedAt: string; certificateImage: string }
interface JourneyCity { city: string; province: string; latitude: number; longitude: number; activityCount: number }

function safeImgs(raw: any): string[] {
  if (Array.isArray(raw)) return raw.filter((value: any) => typeof value === 'string')
  if (typeof raw !== 'string') return []
  try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed.filter((value: any) => typeof value === 'string') : [] } catch { return [] }
}

function resourceUrl(path: string) { return path.startsWith('http') ? path : `${API}${path}` }

export default function TrailPage() {
  const [data, setData] = useState<JourneyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [needLogin, setNeedLogin] = useState(false)
  const [journeyCities, setJourneyCities] = useState<JourneyCity[]>([])
  const [selectedCity, setSelectedCity] = useState<JourneyCity | null>(null)
  const [mapX, setMapX] = useState(0)
  const [mapY, setMapY] = useState(0)
  const [mapScale, setMapScale] = useState(1)
  const [singleMemoryPortrait, setSingleMemoryPortrait] = useState(false)

  const loadJourney = async () => {
    if (!isLoggedIn()) { setNeedLogin(true); setLoading(false); return }
    setLoading(true); setError(''); setNeedLogin(false)
    try {
      const header = userAuthHeader()
      const [res, cityRes] = await Promise.all([
        Taro.request({ url: `${API}/users/me/journey`, header }),
        Taro.request({ url: `${API}/users/me/journey-cities`, header }).catch(() => ({ data: [] })),
      ])
      setData(res.data as JourneyData)
      setJourneyCities(Array.isArray(cityRes.data) ? cityRes.data as JourneyCity[] : [])
    } catch (loadError) { console.error('[trail]', loadError); setError('加载失败') } finally { setLoading(false) }
  }

  useEffect(() => { loadJourney() }, [])
  useDidShow(() => { loadJourney() })
  usePullDownRefresh(() => { loadJourney().then(() => Taro.stopPullDownRefresh()) })

  const memoryImages = useMemo(() => data?.memories ? [...data.memories].reverse().flatMap(memory => safeImgs(memory.memoryImages)).filter(Boolean).slice(0, 3) : [], [data?.memories])
  const latestCertificates = useMemo(() => {
    if (!data?.certificates) return []
    return [...data.certificates].sort((a, b) => new Date(b.issuedAt || b.activityDate || 0).getTime() - new Date(a.issuedAt || a.activityDate || 0).getTime()).slice(0, 3)
  }, [data?.certificates])
  const mappedCities = useMemo(() => journeyCities.flatMap(city => {
    const point = cityPoint(city.city)
    if (!point) { if (process.env.NODE_ENV !== 'production') console.warn(`[trail] missing China map coordinate: ${city.city}`); return [] }
    return [{ ...city, point }]
  }), [journeyCities])

  if (loading) return <View style={fullCenter}><Text style={loadingText}>正在整理你的旅程...</Text></View>
  if (needLogin) return <EmptyPage title='登录行者学社' copy='登录后，查看你和行者学社一起走过的路。' action='去登录' onAction={() => Taro.reLaunch({ url: '/pages/auth/login/index' })} />
  if (error || !data) return <EmptyPage title='我的旅程暂时没有打开' copy='请稍后再试' action='重新加载' onAction={loadJourney} />
  if (data.summary.registeredCount === 0) return <EmptyPage title={'你的旅程，\n还在第一次出发前。'} copy='去参加一次活动，让这里留下你的第一枚行者印记。' action='去看看活动' onAction={() => Taro.switchTab({ url: '/pages/activity/list/index' })} />

  const resetMap = () => { setMapX(0); setMapY(0); setMapScale(1) }
  return (
    <ScrollView scrollY style={{ height: '100vh', background: C.bg }}>
      <View style={{ paddingBottom: '160rpx', paddingTop: '8rpx' }}>
        <View style={{ ...modWrap, marginTop: '8rpx' }}>
          <Text style={{ fontSize: '27rpx', color: C.body, display: 'block' }}>{data.profile.displayName}，</Text>
          <Text style={{ fontSize: '30rpx', fontWeight: '600', color: C.ink, display: 'block', marginTop: '6rpx' }}>你已经和行者学社同行 <Text style={{ fontSize: '42rpx', color: C.green, fontWeight: '600' }}>{data.profile.joinedDays}</Text><Text style={{ fontSize: '25rpx', color: C.body }}> 天</Text></Text>
          <View style={{ height: '20rpx' }} />
          <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around' }}>
            <Mark label='出发' value={data.summary.registeredCount} /><Mark label='点亮' value={data.summary.provinceCount} /><Mark label='证书' value={data.summary.certificateCount} /><Mark label='城市' value={data.summary.cityCount} /><Mark label='同行者' value={data.summary.companionCount} />
          </View>
        </View>

        <View style={{ ...modWrap, minHeight: '360rpx', boxSizing: 'border-box' }}>
          <View style={moduleHeader}><Text style={modTitle}>我的证书</Text>{data.certificates.length > 3 ? <Text onClick={() => Taro.navigateTo({ url: '/pages/mine/certificates/index' })} style={moreText}>查看更多</Text> : null}</View>
          {latestCertificates.length ? <Swiper indicatorDots={false} circular={false} autoplay={false} style={{ width: '100%', height: '262rpx' }}>
            {latestCertificates.map((certificate, index) => <SwiperItem key={certificate.certificateId}>
              <MediaFrame src={resourceUrl(certificate.certificateImage)} contain />
              {latestCertificates.length > 1 ? <Text style={pageCounter}>{index + 1} / {latestCertificates.length}</Text> : null}
            </SwiperItem>)}
          </Swiper> : <View style={emptyMedia}><Text style={emptyMediaText}>完成一场行者活动后，证书会在这里点亮</Text></View>}
        </View>

        <View style={{ ...modWrap, minHeight: '360rpx', boxSizing: 'border-box' }}>
          <Text style={modTitle}>回忆图册</Text><Text style={modSub}>那些走过的路，终会留下回响。</Text>
          {memoryImages.length === 0 ? <View style={emptyMedia}><Text style={emptyMediaText}>我们共同的记忆即将被上传。</Text></View> : memoryImages.length === 1 ? (
            <View onClick={() => Taro.previewImage({ current: resourceUrl(memoryImages[0]), urls: [resourceUrl(memoryImages[0])] })}>
              {singleMemoryPortrait ? <MediaFrame src={resourceUrl(memoryImages[0])} contain /> : <View style={memoryFrame}><Image src={resourceUrl(memoryImages[0])} mode='aspectFill' style={fullImage} onLoad={(event) => setSingleMemoryPortrait(Number(event.detail.width) < Number(event.detail.height))} /></View>}
            </View>
          ) : <Swiper indicatorDots={false} circular={false} autoplay={false} style={{ width: '100%', height: '262rpx' }}>
            {memoryImages.map((image, index) => <SwiperItem key={image}><View onClick={() => Taro.previewImage({ current: resourceUrl(image), urls: memoryImages.map(resourceUrl) })} style={memoryFrame}><Image src={resourceUrl(image)} mode='aspectFill' style={fullImage} /></View>{index < memoryImages.length ? <Text style={pageCounter}>{index + 1} / {memoryImages.length}</Text> : null}</SwiperItem>)}
          </Swiper>}
          {memoryImages.length > 0 ? <View onClick={() => Taro.navigateTo({ url: '/pages/trail/memories/index' })} style={memoryLink}><Text style={{ fontSize: '24rpx', color: C.green }}>查看回忆图册</Text></View> : null}
        </View>

        <View style={modWrap}>
          <View style={moduleHeader}><View><Text style={modTitle}>点亮地图</Text><Text style={{ ...modSub, marginBottom: 0 }}>已点亮 {journeyCities.length} 座城市</Text></View>{mapScale !== 1 || mapX !== 0 || mapY !== 0 ? <Text onClick={resetMap} style={resetText}>重置</Text> : null}</View>
          <MovableArea scaleArea style={mapArea}>
            <MovableView direction='all' inertia scale scaleMin={1} scaleMax={2.5} scaleValue={mapScale} x={mapX} y={mapY} onChange={(event) => { setMapX(Number(event.detail.x || 0)); setMapY(Number(event.detail.y || 0)) }} onScale={(event) => setMapScale(Number(event.detail.scale || 1))} style={mapLayer}>
              <View style={mapCanvas}>
                <Image src={chinaMap} mode='aspectFit' style={fullImage} />
                {mappedCities.map(city => {
                  const showLabel = mappedCities.length <= 10 || selectedCity?.city === city.city || city.activityCount > 1
                  return <View key={`${city.province}-${city.city}`} onClick={() => setSelectedCity(city)} style={{ position: 'absolute', left: `${city.point.x * 100}%`, top: `${city.point.y * 100}%`, transform: 'translate(-50%, -50%)', padding: '16rpx', margin: '-16rpx', zIndex: 2 }}>
                    <View style={cityHalo}><View style={cityDot} /></View>
                    {showLabel ? <Text style={cityLabel}>{city.city}</Text> : null}
                  </View>
                })}
              </View>
            </MovableView>
            {journeyCities.length === 0 ? <View style={mapEmpty}><Text style={{ display: 'block', fontSize: '26rpx', color: C.body }}>还没有点亮城市</Text><Text style={{ display: 'block', fontSize: '22rpx', color: C.muted, marginTop: '8rpx' }}>完成一次活动签到，属于你的足迹会出现在这里。</Text></View> : null}
          </MovableArea>
          {selectedCity ? <View style={tooltip}><Text style={{ fontSize: '24rpx', color: C.green }}>{selectedCity.city}<Text style={{ color: C.muted }}> · 参加 {selectedCity.activityCount} 次活动</Text></Text></View> : null}
        </View>
      </View>
    </ScrollView>
  )
}

function MediaFrame({ src, contain }: { src: string; contain: boolean }) {
  return <View style={mediaFrame}><Image src={src} mode='aspectFill' style={{ ...fullImage, filter: 'blur(18rpx)', transform: 'scale(1.08)', opacity: 0.42 }} /><View style={{ position: 'absolute', inset: 0, background: 'rgba(20,32,25,0.20)' }} /><Image src={src} mode={contain ? 'aspectFit' : 'aspectFill'} style={{ ...fullImage, position: 'absolute', inset: 0 }} /></View>
}
function EmptyPage({ title, copy, action, onAction }: { title: string; copy: string; action: string; onAction: () => void }) { return <View style={emptyPage}><Text style={emptyTitle}>{title}</Text><Text style={emptyCopy}>{copy}</Text><View onClick={onAction} style={button}><Text style={buttonText}>{action}</Text></View></View> }
function Mark({ label, value }: { label: string; value: number }) { return <View style={{ textAlign: 'center', flex: 1 }}><Text style={{ fontSize: '40rpx', fontWeight: '700', color: C.ink, display: 'block', lineHeight: '1.1' }}>{value}</Text><Text style={{ fontSize: '22rpx', color: C.muted, display: 'block', marginTop: '8rpx' }}>{label}</Text></View> }

const fullCenter: React.CSSProperties = { minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const loadingText: React.CSSProperties = { fontSize: '28rpx', color: C.muted }
const emptyPage: React.CSSProperties = { ...fullCenter, flexDirection: 'column', padding: '48rpx', textAlign: 'center' }
const emptyTitle: React.CSSProperties = { fontSize: '32rpx', fontWeight: '700', color: C.ink, display: 'block', lineHeight: '1.5' }
const emptyCopy: React.CSSProperties = { fontSize: '26rpx', color: C.muted, display: 'block', margin: '16rpx 0 32rpx' }
const button: React.CSSProperties = { padding: '16rpx 48rpx', background: C.green, borderRadius: '999rpx', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const buttonText: React.CSSProperties = { color: '#FFFFFF', fontSize: '28rpx' }
const moduleHeader: React.CSSProperties = { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16rpx' }
const moreText: React.CSSProperties = { fontSize: '24rpx', color: C.green }
const mediaFrame: React.CSSProperties = { height: '236rpx', borderRadius: '18rpx', overflow: 'hidden', background: '#EAF0EB', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }
const memoryFrame: React.CSSProperties = { height: '236rpx', borderRadius: '18rpx', overflow: 'hidden', background: '#EAF0EB' }
const fullImage: React.CSSProperties = { width: '100%', height: '100%' }
const pageCounter: React.CSSProperties = { fontSize: '22rpx', color: C.muted, textAlign: 'center', display: 'block', marginTop: '6rpx' }
const emptyMedia: React.CSSProperties = { height: '260rpx', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }
const emptyMediaText: React.CSSProperties = { fontSize: '26rpx', color: C.muted }
const memoryLink: React.CSSProperties = { marginTop: '12rpx', height: '68rpx', borderRadius: '999rpx', background: C.softGreen, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const mapArea: React.CSSProperties = { height: '460rpx', width: '100%', borderRadius: '18rpx', overflow: 'hidden', background: '#F2F5F2' }
const mapLayer: React.CSSProperties = { height: '460rpx', width: '100%' }
const mapCanvas: React.CSSProperties = { position: 'absolute', top: '44rpx', left: 0, right: 0, aspectRatio: '696 / 379' }
const resetText: React.CSSProperties = { fontSize: '22rpx', color: C.muted, padding: '8rpx 12rpx' }
const cityHalo: React.CSSProperties = { width: '36rpx', height: '36rpx', borderRadius: '50%', background: 'rgba(46,125,90,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const cityDot: React.CSSProperties = { width: '14rpx', height: '14rpx', borderRadius: '50%', background: C.green }
const cityLabel: React.CSSProperties = { position: 'absolute', left: '42rpx', top: '7rpx', fontSize: '21rpx', color: '#34463B', whiteSpace: 'nowrap' }
const mapEmpty: React.CSSProperties = { position: 'absolute', left: '32rpx', right: '32rpx', bottom: '26rpx', textAlign: 'center', pointerEvents: 'none' }
const tooltip: React.CSSProperties = { marginTop: '14rpx', padding: '14rpx 18rpx', background: C.softGreen, borderRadius: '14rpx' }
