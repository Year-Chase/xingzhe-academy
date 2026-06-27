import { View, Text, Image, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { getUserId } from '../../../utils/user'

const API = 'http://172.20.10.10:3000'

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
  certificateStatus: string
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

    const uid = getUserId()
    if (!uid) { setError('未登录'); setLoading(false); return }

    setLoading(true)
    Taro.request({ url: `${API}/users/${uid}/journey` }).then(res => {
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

      {/* ════ Certificate Image Card (image as background, text overlaid) ──── */}
      <View style={{ margin: '16rpx 24rpx', borderRadius: '28rpx', overflow: 'hidden', position: 'relative', aspectRatio: '3 / 4', border: `1rpx solid ${C.line}` }}>
        {/* Background layer */}
        {cert.certificateImage && !imgFailed ? (
          <Image src={cert.certificateImage.startsWith('http') ? cert.certificateImage : `${API}${cert.certificateImage}`}
            mode='aspectFill' style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} onError={() => setImgFailed(true)} />
        ) : (
          <View style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #E8E2D8 0%, #DFE8DE 35%, #DCE6E2 70%, #C4D5CA 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ textAlign: 'center' }}>
              <Text style={{ fontSize: '64rpx', display: 'block', marginBottom: '16rpx' }}>🏅</Text>
              <Text style={{ fontSize: '28rpx', color: C.green, fontWeight: '600' }}>行者学社</Text>
              <Text style={{ fontSize: '22rpx', color: C.muted, display: 'block', marginTop: '8rpx' }}>行者证书</Text>
            </View>
          </View>
        )}

        {/* Soft overlay for text readability */}
        <View style={{ position: 'absolute', inset: 0, background: cert.certificateImage ? 'rgba(0,0,0,0.12)' : 'transparent' }} />

        {/* Text layer in safe zone: top 30% – bottom 25% */}
        <View style={{ position: 'absolute', left: '10%', right: '10%', top: '28%', bottom: '22%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: '24rpx', color: C.ink, letterSpacing: '4rpx', opacity: 0.8 }}>完成证明</Text>
          <Text style={{ fontSize: '52rpx', fontWeight: '700', color: C.ink, display: 'block', marginTop: '24rpx' }}>
            {cert.recipientName || '行者'}
          </Text>
          <Text style={{ fontSize: '27rpx', color: C.body, textAlign: 'center', display: 'block', marginTop: '20rpx', lineHeight: '1.6' }}>
            于 {cert.activityDate ? fmtDate(cert.activityDate.slice(0, 10)) : '-'} 完成{' '}
            <Text style={{ fontWeight: '600', color: C.ink }}>「{cert.activityTitle || '行者学社活动'}」</Text>
          </Text>
          <Text style={{ fontSize: '26rpx', color: C.body, textAlign: 'center', display: 'block', marginTop: '20rpx', fontStyle: 'italic', lineHeight: '1.7' }}>
            {cert.certificateText || '这段路，已成为你的行者印记。'}
          </Text>
          <View style={{ marginTop: '24rpx', fontSize: '23rpx', color: C.muted, textAlign: 'center', lineHeight: '1.8' }}>
            <Text>地点：{(cert.province || '') + (cert.city ? ' · ' + cert.city : '') || '-'}</Text>
            <Text style={{ display: 'block', marginTop: '2rpx' }}>颁发方：{cert.issuerName || '行者学社'}</Text>
            <Text style={{ display: 'block', marginTop: '2rpx' }}>证书编号：{cert.certificateNo || '-'}</Text>
            <Text style={{ display: 'block', marginTop: '2rpx' }}>颁发日期：{cert.issuedAt ? fmtDateFull(cert.issuedAt.slice(0, 10)) : '-'}</Text>
          </View>
        </View>

        {/* "完成证明" badge top-left */}
        <View style={{ position: 'absolute', top: '24rpx', left: '24rpx', padding: '8rpx 20rpx', background: 'rgba(255,255,255,0.85)', borderRadius: '999rpx' }}>
          <Text style={{ fontSize: '22rpx', color: C.green, fontWeight: '500', letterSpacing: '2rpx' }}>完成证明</Text>
        </View>
      </View>

      {/* ════ Brand Footer ──── */}
      <View style={{ margin: '32rpx 24rpx', textAlign: 'center' }}>
        <Text style={{ fontSize: '22rpx', color: C.muted, display: 'block' }}>行者学社</Text>
        <Text style={{ fontSize: '22rpx', color: C.muted, display: 'block', marginTop: '4rpx' }}>每一次出发，都会成为你的行者印记。</Text>
      </View>

      {/* ════ Actions ──── */}
      <View style={{ margin: '0 24rpx', display: 'flex', gap: '16rpx' }}>
        <Button onClick={() => Taro.showToast({ title: '证书分享能力即将开放', icon: 'none' })}
          style={{ flex: 1, height: '92rpx', borderRadius: '999rpx', background: C.green, color: '#FFFFFF', fontSize: '30rpx', fontWeight: '600', lineHeight: '92rpx', border: 'none', textAlign: 'center' }}>
          分享证书
        </Button>
      </View>
    </View>
  )
}
