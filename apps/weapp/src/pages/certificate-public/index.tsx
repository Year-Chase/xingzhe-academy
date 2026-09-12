import { Image, Text, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro, { useDidShow, useRouter, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { API_BASE_URL as API } from '../../config/api'

type PublicCertificate = { certificateImage: string; friendShareImage?: string; timelineShareImage?: string; activityTitle: string; activityDescription: string; location: string; issuedAt: string }
const C = { bg: '#F7F5F1', card: '#FFFFFF', ink: '#18231E', muted: '#8C918C', line: '#E6ECE7' }

export default function PublicCertificatePage() {
  const router = useRouter()
  const token = String((router.params as any)?.token || '')
  const [certificate, setCertificate] = useState<PublicCertificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setError('证书链接无效'); setLoading(false); return }
    setLoading(true)
    Taro.request({ url: `${API}/users/certificates/public/${encodeURIComponent(token)}`, timeout: 15000 })
      .then(response => {
        if (response.statusCode < 200 || response.statusCode >= 300) throw new Error('not found')
        setCertificate(response.data as PublicCertificate)
      })
      .catch(() => setError('证书不存在或已失效'))
      .finally(() => setLoading(false))
  }, [token])

  useDidShow(() => { Taro.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] as any }).catch(() => undefined) })
  const resolveAsset = (path?: string) => path ? (path.startsWith('http') ? path : `${API}${path}`) : undefined
  const imageUrl = resolveAsset(certificate?.certificateImage)
  const shareTitle = certificate ? `我获得了【${certificate.activityTitle}】的行者证书，下一次一起走？` : '行者证书'
  useShareAppMessage(() => ({ title: shareTitle, path: `/pages/certificate-public/index?token=${encodeURIComponent(token)}`, imageUrl: resolveAsset(certificate?.friendShareImage || certificate?.certificateImage) } as any))
  useShareTimeline(() => ({ title: shareTitle, query: `token=${encodeURIComponent(token)}`, imageUrl: resolveAsset(certificate?.timelineShareImage || certificate?.certificateImage) } as any))

  if (loading) return <View style={center}><Text style={{ fontSize: '28rpx', color: C.muted }}>正在打开证书...</Text></View>
  if (error || !certificate) return <View style={{ ...center, flexDirection: 'column', padding: '48rpx' }}><Text style={{ fontSize: '32rpx', fontWeight: '600', color: C.ink }}>{error || '证书不存在'}</Text></View>
  return <View style={{ minHeight: '100vh', background: C.bg, padding: '16rpx 24rpx 80rpx', boxSizing: 'border-box' }}>
    <View style={{ aspectRatio: '1754 / 1240', background: '#EDF2EE', borderRadius: '24rpx', overflow: 'hidden', border: `1rpx solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Image src={imageUrl || ''} mode='aspectFit' style={{ width: '100%', height: '100%' }} /></View>
    <View style={{ marginTop: '22rpx', background: C.card, borderRadius: '18rpx', padding: '24rpx', border: `1rpx solid ${C.line}` }}>
      <Text style={{ display: 'block', fontSize: '30rpx', fontWeight: '600', color: C.ink }}>{certificate.activityTitle}</Text>
      {certificate.activityDescription ? <Text style={{ display: '-webkit-box', marginTop: '10rpx', overflow: 'hidden', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', fontSize: '24rpx', color: C.muted, lineHeight: '1.5' }}>{certificate.activityDescription}</Text> : null}
      {certificate.location ? <Text style={{ display: 'block', marginTop: '12rpx', fontSize: '23rpx', color: C.muted }}>{certificate.location}</Text> : null}
    </View>
  </View>
}

const center: React.CSSProperties = { minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }
