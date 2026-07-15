import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState, useEffect, useMemo } from 'react'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { isLoggedIn, userAuthHeader } from '../../utils/user'

import { API_BASE_URL as API } from '../../config/api'

const C = {
  bg: '#F7F5F1',
  card: '#FFFFFF',
  ink: '#18231E',
  body: '#4E5A52',
  muted: '#8C918C',
  line: '#E6ECE7',
  green: '#3F6B4F',
  softGreen: '#EEF5EF',
  gold: '#D8C8A0',
}

// ── Unified module styling ──
const modWrap: React.CSSProperties = { margin: '36rpx 24rpx 0', background: C.card, borderRadius: '28rpx', padding: '28rpx', border: `1rpx solid ${C.line}` }
const modTitle: React.CSSProperties = { fontSize: '26rpx', fontWeight: '600', color: C.ink, display: 'block', marginBottom: '6rpx' }
const modSub: React.CSSProperties = { fontSize: '23rpx', color: C.muted, display: 'block', marginBottom: '16rpx' }

interface JourneyData {
  userId: string
  profile: { displayName: string; avatarUrl: string; joinedDays: number }
  summary: { registeredCount: number; completedCount: number; checkedInCount: number; provinceCount: number; cityCount: number; companionCount: number; certificateCount: number }
  provinces: { province: string; activityCount: number }[]
  memories: { activityId: number; title: string; province: string; city: string; memoryImages: any; memoryText: string; coverImage: string }[]
  certificates: { certificateId: string; activityId: number; recipientName: string; activityTitle: string; activityDate: string; issuerName: string; certificateImage: string; province: string; city: string; certificateText: string; certificateNo: string; issuedAt: string }[]
}

function safeImgs(raw: any): string[] {
  if (Array.isArray(raw)) return raw.filter((v: any) => typeof v === 'string')
  if (typeof raw !== 'string') return []
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p.filter((v: any) => typeof v === 'string') : [] } catch (e) { console.error('[trail] safeImgs parse error', e); return [] }
}

export default function TrailPage() {
  const [data, setData] = useState<JourneyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [needLogin, setNeedLogin] = useState(false)

  const loadJourney = async () => {
    if (!isLoggedIn()) { setNeedLogin(true); setLoading(false); return }
    setLoading(true); setError(''); setNeedLogin(false)
    try {
      const res = await Taro.request({ url: `${API}/users/me/journey`, header: userAuthHeader() })
      setData(res.data as JourneyData)
    } catch (e) { console.error('[trail]', e); setError('加载失败') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadJourney() }, [])
  useDidShow(() => { loadJourney() })
  usePullDownRefresh(() => { loadJourney().then(() => Taro.stopPullDownRefresh()) })

  // ── Computed values ──
  const memoryPreviewImages = useMemo(() => {
    if (!data?.memories) return []
    return [...data.memories].reverse().flatMap(m => safeImgs(m.memoryImages)).filter(Boolean).slice(0, 3)
  }, [data?.memories])

  // Sort certificates by activity end time (issuedAt) desc, then take latest 3
  const latestCertificates = useMemo(() => {
    if (!data?.certificates) return []
    const getEndTime = (c: any) => c.issuedAt || c.activityDate || c.createdAt || 0
    return [...data.certificates].sort((a, b) =>
      new Date(getEndTime(b) || 0).getTime() - new Date(getEndTime(a) || 0).getTime()
    ).slice(0, 3)
  }, [data?.certificates])

  const fmtDate = (s: string) => { if (!s) return ''; const d = new Date(s); return `${d.getMonth()+1}月${d.getDate()}日` }
  const goActivity = (id: number) => Taro.navigateTo({ url: `/pages/activity/detail/index?id=${id}` })
  const goHome = () => Taro.switchTab({ url: '/pages/index/index' })
  const goMemories = () => Taro.navigateTo({ url: '/pages/trail/memories/index' })
  const goCert = (certId: string) => {
    Taro.navigateTo({ url: `/pages/journey/certificate/index?certificateId=${certId}` })
  }
  const goMoreCerts = () => Taro.navigateTo({ url: '/pages/mine/certificates/index' })

  // ── Loading ──
  if (loading) {
    return <View style={fullC}><Text style={{ fontSize: '28rpx', color: C.muted }}>正在整理你的行者之路...</Text></View>
  }

  // ── Need login ──
  if (needLogin && !loading) {
    return (
      <View style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48rpx' }}>
        <Text style={{ fontSize: '32rpx', fontWeight: '700', color: C.ink, textAlign: 'center', display: 'block', marginBottom: '8rpx' }}>登录行者学社</Text>
        <Text style={{ fontSize: '26rpx', color: C.muted, textAlign: 'center', display: 'block', marginBottom: '32rpx' }}>登录后，查看你和行者学社一起走过的路。</Text>
        <View onClick={() => Taro.reLaunch({ url: '/pages/auth/login/index' })} style={{ padding: '18rpx 56rpx', background: C.green, borderRadius: '999rpx' }}>
          <Text style={{ fontSize: '30rpx', fontWeight: '600', color: '#FFFFFF' }}>去登录</Text>
        </View>
      </View>
    )
  }

  // ── Error ──
  if (error || !data) {
    return (
      <View style={{ ...fullC, flexDirection: 'column', padding: '48rpx' }}>
        <Text style={{ fontSize: '32rpx', fontWeight: '700', color: C.ink, display: 'block', marginBottom: '12rpx' }}>行者之路暂时没有打开</Text>
        <Text style={{ fontSize: '26rpx', color: C.muted, display: 'block', marginBottom: '32rpx', textAlign: 'center' }}>请稍后再试</Text>
        <View onClick={loadJourney} style={btnStyle}><Text style={{ color: '#FFFFFF', fontSize: '28rpx' }}>重新加载</Text></View>
      </View>
    )
  }

  const s = data.summary
  const p = data.profile

  // ── Empty ──
  if (s.registeredCount === 0) {
    return (
      <View style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48rpx' }}>
        <Text style={{ fontSize: '34rpx', fontWeight: '700', color: C.ink, textAlign: 'center', display: 'block', lineHeight: '1.5' }}>你的行者之路，{'\n'}还在第一次出发前。</Text>
        <Text style={{ fontSize: '26rpx', color: C.muted, textAlign: 'center', display: 'block', marginTop: '16rpx' }}>去参加一次活动，让这里留下你的第一枚行者印记。</Text>
        <View onClick={goHome} style={{ ...btnStyle, marginTop: '32rpx' }}><Text style={{ color: '#FFFFFF', fontSize: '28rpx' }}>去看看活动</Text></View>
      </View>
    )
  }

  return (
    <ScrollView scrollY style={{ height: '100vh', background: C.bg }}>
      <View style={{ paddingBottom: '160rpx', paddingTop: '16rpx' }}>

        {/* ════ 1. Hero ──── */}
        <View style={{ margin: '8rpx 24rpx', background: 'linear-gradient(160deg, #F0EEE8 0%, #E8EFEA 40%, #E2EBE5 100%)', borderRadius: '32rpx', padding: '44rpx 32rpx 36rpx', position: 'relative', overflow: 'hidden' }}>
          <View style={{ position: 'absolute', top: '80rpx', left: '10%', right: '15%', height: '2rpx', background: 'rgba(63,111,79,0.1)', borderRadius: '1rpx' }} />
          <View style={{ position: 'absolute', top: '160rpx', left: '25%', right: '35%', height: '2rpx', background: 'rgba(63,111,79,0.06)', borderRadius: '1rpx', transform: 'rotate(-8deg)' }} />
          <View style={{ position: 'absolute', top: '76rpx', left: '18%', width: '8rpx', height: '8rpx', borderRadius: '50%', background: C.green, opacity: 0.3 }} />
          <View style={{ position: 'absolute', top: '156rpx', left: '30%', width: '6rpx', height: '6rpx', borderRadius: '50%', background: C.green, opacity: 0.2 }} />

          <View style={{ position: 'relative', zIndex: 1 }}>
            <Text style={{ fontSize: '26rpx', fontWeight: '700', color: C.ink, letterSpacing: '3rpx' }}>行者之路</Text>
            <Text style={{ fontSize: '36rpx', fontWeight: '700', color: C.ink, display: 'block', marginTop: '28rpx', lineHeight: '1.35' }}>
              与你同行的每一步，{'\n'}都会留下印记
            </Text>
            <View style={{ marginTop: '32rpx' }}>
              <Text style={{ fontSize: '26rpx', color: C.body }}>
                {p.displayName}，你已经和行者学社同行 <Text style={{ fontWeight: '700', color: C.green, fontSize: '44rpx', lineHeight: '1' }}>{p.joinedDays}</Text> 天
              </Text>
              <Text style={{ fontSize: '24rpx', color: C.muted, display: 'block', marginTop: '8rpx' }}>
                走过 {s.cityCount} 座城市，留下 {s.registeredCount} 次出发
              </Text>
            </View>
          </View>
        </View>

        {/* ════ 2. 行者印记 (title+subtitle+marks all inside one card) ──── */}
        <View style={modWrap}>
          <Text style={modTitle}>行者印记</Text>
          <Text style={modSub}>这些不是数字，是你走过的路。</Text>
          <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around' }}>
            <Mark label='出发' value={s.registeredCount} />
            <Mark label='点亮' value={s.provinceCount} />
            <Mark label='证书' value={s.certificateCount} />
            <Mark label='城市' value={s.cityCount} />
            <Mark label='同行者' value={s.companionCount} />
          </View>
        </View>

        {/* ════ 3. 我的证书 ──── */}
        {/* V2.6E: 3-column compact grid, latest 3 certs, no big-card+scroll hybrid */}
        {data.certificates.length > 0 && (
          <View style={modWrap}>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16rpx' }}>
              <Text style={modTitle}>我的证书</Text>
              {data.certificates.length > 3 && (
                <Text onClick={goMoreCerts} style={{ fontSize: '24rpx', color: C.green }}>查看更多</Text>
              )}
            </View>
            <View style={{ display: 'flex', flexDirection: 'row', gap: '16rpx' }}>
              {latestCertificates.map(c => (
                <View key={c.certificateId} onClick={() => goCert(c.certificateId)}
                  style={{ flex: 1, borderRadius: '16rpx', overflow: 'hidden', position: 'relative', aspectRatio: '3 / 4', background: 'linear-gradient(160deg, #E8E2D8 0%, #DFE8DE 50%, #DCE6E2 100%)' }}>
                  {c.certificateImage ? (
                    <Image src={c.certificateImage.startsWith('http') ? c.certificateImage : `${API}${c.certificateImage}`}
                      mode='aspectFill' style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
                  ) : (
                    <View style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: '40rpx' }}>🏅</Text>
                    </View>
                  )}
                  <View style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.08)' }} />
                  <View style={{ position: 'absolute', left: '10%', right: '10%', bottom: '10%' }}>
                    <Text style={{ fontSize: '22rpx', fontWeight: '600', color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{c.activityTitle}</Text>
                    <Text style={{ fontSize: '18rpx', color: C.muted, marginTop: '4rpx', display: 'block' }}>{fmtDate(c.activityDate)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
        {data.certificates.length === 0 && (
          <View style={{ margin: '24rpx 24rpx 0', padding: '40rpx 32rpx', background: C.card, borderRadius: '28rpx', border: `1rpx solid ${C.line}`, textAlign: 'center' }}>
            <Text style={{ fontSize: '26rpx', color: C.muted }}>完成一场行者活动后，证书会在这里点亮</Text>
          </View>
        )}

        {/* ════ 4. 回忆图册 (max 3 images, centered, no grouping) ──── */}
        <View style={modWrap}>
          <Text style={modTitle}>回忆图册</Text>
          <Text style={modSub}>那些走过的路，终会留下回响。</Text>

          {memoryPreviewImages.length > 0 ? (
            <>
              {memoryPreviewImages.length < 3 ? (
                /* 1 or 2 images — centered */
                <View style={{ display: 'flex', justifyContent: 'center', gap: '16rpx' }}>
                  {memoryPreviewImages.map((img, i) => (
                    <View key={i} style={{ width: '200rpx', height: '240rpx', borderRadius: '20rpx', overflow: 'hidden', background: 'linear-gradient(160deg, #E8E2D8 0%, #DFE8DE 50%, #DCE6E2 100%)' }}>
                      <Image src={img.startsWith('http') ? img : `${API}${img}`} mode='aspectFill' style={{ width: '100%', height: '100%' }} />
                    </View>
                  ))}
                </View>
              ) : (
                /* 3 images — horizontal scroll */
                <ScrollView scrollX style={{ whiteSpace: 'nowrap' }}>
                  <View style={{ display: 'flex', flexDirection: 'row', gap: '16rpx' }}>
                    {memoryPreviewImages.map((img, i) => (
                      <View key={i} style={{ width: '200rpx', height: '240rpx', flexShrink: 0, borderRadius: '20rpx', overflow: 'hidden', background: 'linear-gradient(160deg, #E8E2D8 0%, #DFE8DE 50%, #DCE6E2 100%)' }}>
                        <Image src={img.startsWith('http') ? img : `${API}${img}`} mode='aspectFill' style={{ width: '100%', height: '100%' }} />
                      </View>
                    ))}
                    <View style={{ width: '16rpx', flexShrink: 0 }} />
                  </View>
                </ScrollView>
              )}

              {/* "查看回忆图册" button */}
              <View onClick={goMemories}
                style={{ marginTop: '20rpx', height: '76rpx', borderRadius: '999rpx', background: C.softGreen, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1rpx solid ${C.line}` }}>
                <Text style={{ fontSize: '26rpx', color: C.green }}>查看回忆图册</Text>
              </View>
            </>
          ) : (
            <View style={{ padding: '32rpx 0', textAlign: 'center' }}>
              <Text style={{ fontSize: '26rpx', color: C.muted }}>活动完成后，Admin 上传的回忆会在这里被点亮。</Text>
            </View>
          )}
        </View>

        {/* ════ 5. 点亮地图 ──── */}
        {data.provinces.length > 0 && (
          <View style={modWrap}>
            <View style={{ background: 'linear-gradient(160deg, #F0EFEA 0%, #E8EFEA 50%, #E2EBE5 100%)', borderRadius: '20rpx', padding: '36rpx 28rpx 24rpx', marginBottom: '20rpx', position: 'relative', overflow: 'hidden' }}>
              <View style={{ position: 'absolute', top: '24rpx', left: '15%', width: '80%', height: '2rpx', background: 'rgba(63,111,79,0.1)', transform: 'rotate(-8deg)' }} />
              <View style={{ position: 'absolute', top: '70rpx', left: '20%', width: '65%', height: '2rpx', background: 'rgba(63,111,79,0.06)', transform: 'rotate(-4deg)' }} />
              <View style={{ position: 'absolute', top: '20rpx', left: '22%', width: '8rpx', height: '8rpx', borderRadius: '50%', background: C.green, opacity: 0.3 }} />
              <View style={{ position: 'absolute', top: '66rpx', left: '55%', width: '6rpx', height: '6rpx', borderRadius: '50%', background: C.green, opacity: 0.2 }} />
              <Text style={{ fontSize: '28rpx', fontWeight: '700', color: C.ink, display: 'block', position: 'relative', zIndex: 1 }}>点亮地图</Text>
              <Text style={{ fontSize: '24rpx', color: C.muted, display: 'block', marginTop: '8rpx', position: 'relative', zIndex: 1 }}>你已点亮 {s.provinceCount} 个省份，走过 {s.cityCount} 座城市</Text>
              <Text style={{ fontSize: '22rpx', color: C.muted, display: 'block', marginTop: '40rpx', position: 'relative', zIndex: 1 }}>已点亮的地方，正在成为你的行者地图</Text>
            </View>
            <View style={{ display: 'flex', flexWrap: 'wrap', gap: '12rpx' }}>
              {data.provinces.map(prov => (
                <View key={prov.province} onClick={() => Taro.showToast({ title: `已展示你在${prov.province}的行者印记`, icon: 'none' })}
                  style={{ padding: '10rpx 24rpx', background: C.softGreen, borderRadius: '999rpx', border: `1rpx solid ${C.line}` }}>
                  <Text style={{ fontSize: '24rpx', color: C.green }}>{prov.province}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        {data.provinces.length === 0 && (
          <View style={{ margin: '24rpx 24rpx 0', padding: '40rpx 32rpx', background: C.card, borderRadius: '28rpx', border: `1rpx solid ${C.line}`, textAlign: 'center' }}>
            <Text style={{ fontSize: '26rpx', color: C.muted }}>下一次出发，将点亮你的第一片地图。</Text>
          </View>
        )}

      </View>
    </ScrollView>
  )
}

function Mark({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ textAlign: 'center', flex: 1 }}>
      <Text style={{ fontSize: '40rpx', fontWeight: '700', color: C.ink, display: 'block', lineHeight: '1.1' }}>{value}</Text>
      <Text style={{ fontSize: '22rpx', color: C.muted, display: 'block', marginTop: '8rpx' }}>{label}</Text>
    </View>
  )
}

const fullC: React.CSSProperties = { minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const btnStyle: React.CSSProperties = { padding: '16rpx 48rpx', background: C.green, borderRadius: '999rpx', display: 'flex', alignItems: 'center', justifyContent: 'center' }
