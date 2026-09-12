import { View, Text, Image, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useDidShow, useRouter, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { isLoggedIn, userAuthHeader } from '../../../utils/user'

import { API_BASE_URL as API } from '../../../config/api'

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

interface CertData {
  certificateId: string; activityId: number; recipientName: string; activityTitle: string
  activityDate: string; issuerName: string; certificateImage: string
  province: string; city: string; certificateText: string; certificateNo: string; issuedAt: string
  certificateStatus: string; publicToken: string; friendShareImage?: string; timelineShareImage?: string
}

export default function CertificatePage() {
  const router = useRouter()
  const [cert, setCert] = useState<CertData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    const p = router.params as any
    const certId = p.certificateId as string
    if (!certId) { setError('参数异常'); setLoading(false); return }

    if (!isLoggedIn()) { setError('未登录'); setLoading(false); return }

    setLoading(true)
    Taro.request({ url: `${API}/users/me/journey`, header: userAuthHeader() }).then(res => {
      const allCerts = ((res.data as any)?.certificates || []) as CertData[]
      const found = allCerts.find(c => c.certificateId === certId)
      if (found) setCert(found)
      else setError('证书未找到')
    }).catch(e => { console.error('[certificate]', e); setError('加载失败') })
    .finally(() => setLoading(false))
  }, [router.params])

  const fmtDate = (s: string) => {
    if (!s) return ''
    const d = new Date(s)
    return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`
  }
  const fmtDateFull = (s: string) => {
    if (!s) return ''
    const d = new Date(s)
    return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`
  }

  useDidShow(() => { Taro.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] as any }).catch(() => undefined) })
  const publicPath = cert?.publicToken ? `/pages/certificate-public/index?token=${encodeURIComponent(cert.publicToken)}` : '/pages/index/index'
  const assetUrl = (path?: string) => path ? (path.startsWith('http') ? path : `${API}${path}`) : undefined
  const certificateShareTitle = cert ? `我获得了【${cert.activityTitle}】的行者证书，下一次一起走？` : '行者证书'
  useShareAppMessage(() => ({ title: certificateShareTitle, path: publicPath, imageUrl: assetUrl(cert?.friendShareImage || cert?.certificateImage) } as any))
  useShareTimeline(() => ({ title: certificateShareTitle, query: cert?.publicToken ? `token=${encodeURIComponent(cert.publicToken)}` : '', imageUrl: assetUrl(cert?.timelineShareImage || cert?.certificateImage) } as any))

  // ── Loading ──
  if (loading) {
    return <View style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: '28rpx', color: C.muted }}>加载中...</Text></View>
  }

  // ── Error ──
  if (error || !cert) {
    return (
      <View style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48rpx' }}>
        <Text style={{ fontSize: '32rpx', fontWeight: '700', color: C.ink, display: 'block', marginBottom: '12rpx' }}>{error || '证书数据异常'}</Text>
        <Button onClick={() => Taro.navigateBack()} style={{ marginTop: '24rpx', width: '200rpx', height: '76rpx', borderRadius: '999rpx', background: C.card, border: `1rpx solid ${C.line}`, color: C.ink, fontSize: '28rpx', lineHeight: '76rpx', textAlign: 'center' }}>返回</Button>
      </View>
    )
  }

  return (
    <View style={{ minHeight: '100vh', background: C.bg, paddingBottom: '80rpx' }}>

      <View style={{ margin: '16rpx 24rpx', borderRadius: '24rpx', overflow: 'hidden', aspectRatio: '1754 / 1240', border: `1rpx solid ${C.line}`, background: '#EDF2EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {cert.certificateImage && !imgFailed ? (
          <Image src={cert.certificateImage.startsWith('http') ? cert.certificateImage : `${API}${cert.certificateImage}`}
            mode='aspectFit' style={{ width: '100%', height: '100%' }} onError={() => setImgFailed(true)} />
        ) : (
          <View style={{ background: 'linear-gradient(160deg, #E8E2D8 0%, #DFE8DE 35%, #DCE6E2 70%, #C4D5CA 100%)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ textAlign: 'center' }}>
              <Text style={{ fontSize: '64rpx', display: 'block', marginBottom: '16rpx' }}>🏅</Text>
              <Text style={{ fontSize: '28rpx', color: C.green, fontWeight: '600' }}>行者学社</Text>
              <Text style={{ fontSize: '22rpx', color: C.muted, display: 'block', marginTop: '8rpx' }}>行者证书</Text>
            </View>
          </View>
        )}

      </View>

      {/* ════ Brand Footer ──── */}
      <View style={{ margin: '32rpx 24rpx', textAlign: 'center' }}>
        <Text style={{ fontSize: '22rpx', color: C.muted, display: 'block' }}>行者学社</Text>
        <Text style={{ fontSize: '22rpx', color: C.muted, display: 'block', marginTop: '4rpx' }}>每一次出发，都会成为你的行者印记。</Text>
      </View>

      {/* ════ Actions ──── */}
      <View style={{ margin: '0 24rpx', display: 'flex', gap: '16rpx' }}>
        <Button openType='share'
          style={{ flex: 1, height: '92rpx', borderRadius: '999rpx', background: C.green, color: '#FFFFFF', fontSize: '30rpx', fontWeight: '600', lineHeight: '92rpx', border: 'none', textAlign: 'center' }}>
          分享证书
        </Button>
      </View>
    </View>
  )
}
