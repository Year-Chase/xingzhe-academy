import { View, Text, Button, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect, useCallback } from 'react'
import { getUserId } from '../../../utils/user'

const API = 'http://172.20.10.10:3000'

type QRState = 'ACTIVE' | 'CHECKED_IN' | 'EXPIRED' | 'loading'

const C = {
  bg: '#F7F6F2', white: '#FFFFFF', green: '#3F6B4F', dark: '#18231E',
  body: '#3E463F', neutral: '#7A8178', secondary: '#A6AAA2',
  lightGreen: '#EEF5EF', border: '#EDE9DF', disabledBg: '#E9EAE5',
}

export default function QRPage() {
  const router = useRouter()
  const [activityId, setActivityId] = useState(0)
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [qrStatus, setQrStatus] = useState<QRState>('loading')
  const [acting, setActing] = useState(false)
  const [error, setError] = useState('')
  const [location, setLocation] = useState('')
  const [startTime, setStartTime] = useState('')
  // V2.5C: group QR
  const [groupQr, setGroupQr] = useState<any>(null)
  const [showGroupQr, setShowGroupQr] = useState(false)

  useEffect(() => {
    const p = router.params as any
    const id = Number(p.activityId || p.id)
    if (id && !Number.isNaN(id)) setActivityId(id)
    if (p.title) setTitle(decodeURIComponent(p.title))
  }, [router.params])

  useEffect(() => {
    if (activityId === 0) return
    load(activityId)
  }, [activityId])

  const load = useCallback(async (id: number) => {
    setQrStatus('loading'); setError('')
    try {
      const [detail, qr] = await Promise.all([
        Taro.request({ url: `${API}/activity/${id}` }),
        Taro.request({ url: `${API}/activity/${id}/qr?userId=${getUserId()}` }),
      ])
      const d = detail.data as any
      setTitle(d.title || title)
      setLocation(d.location || '')
      setStartTime(d.startTime || '')
      // V2.5C: capture group QR info
      if (d.groupQrType && d.groupQrType !== 'NONE' && d.groupQrImageUrl) {
        setGroupQr({ type: d.groupQrType, imageUrl: d.groupQrImageUrl, title: d.groupQrTitle || '加入活动群', desc: d.groupQrDescription || '活动通知、集合安排和现场事项将在群内同步' })
      }
      const q = qr.data as any
      setCode(q.code || '')
      if (q.status === 'ACTIVE') { setQrStatus('ACTIVE') }
      else {
        const s = await Taro.request({ url: `${API}/activity/${id}/status?userId=${getUserId()}` })
        const st = (s.data as any)?.status
        setQrStatus(st === 'CHECKED_IN' ? 'CHECKED_IN' : 'EXPIRED')
      }
    } catch {
      try {
        const s = await Taro.request({ url: `${API}/activity/${id}/status?userId=${getUserId()}` })
        const st = (s.data as any)?.status
        if (st === 'CHECKED_IN') setQrStatus('CHECKED_IN')
        else if (st === 'EXPIRED') setQrStatus('EXPIRED')
        else setQrStatus('ACTIVE')
      } catch { setError('加载失败'); setQrStatus('EXPIRED') }
    }
  }, [])

  const doCheckin = async () => {
    if (acting || !code) return; setActing(true)
    try {
      const res = await Taro.request({ method: 'POST', url: `${API}/activity/${activityId}/checkin`, data: { code } })
      if (res.data?.status === 'CHECKED_IN') { setQrStatus('CHECKED_IN'); Taro.showToast({ title: '签到成功', icon: 'success' }) }
    } catch { Taro.showToast({ title: '签到失败，请重试', icon: 'none' }) }
    finally { setActing(false) }
  }

  const fmtDate = (d: string) => {
    if (!d) return ''; const dt = new Date(d)
    const w = ['日', '一', '二', '三', '四', '五', '六'][dt.getDay()]
    return `${dt.getMonth() + 1}月${dt.getDate()}日（周${w}） ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
  }

  if (activityId === 0 && !error) {
    return (
      <View style={{ padding: '120rpx 32rpx', textAlign: 'center', minHeight: '100vh', background: C.bg }}>
        <Text style={{ display: 'block', fontSize: '32rpx', color: '#B35B4B', marginBottom: '16rpx' }}>活动信息异常</Text>
        <Text style={{ display: 'block', fontSize: '28rpx', color: C.neutral, marginBottom: '32rpx' }}>请返回活动详情页重试</Text>
        <Button onClick={() => Taro.navigateBack()} style={{ height: '88rpx', borderRadius: '999rpx', background: C.green, color: '#FFFFFF', fontSize: '30rpx', lineHeight: '88rpx', border: 'none', padding: '0 48rpx' }}>返回</Button>
      </View>
    )
  }

  if (qrStatus === 'loading') {
    return <View style={{ padding: '120rpx 32rpx', textAlign: 'center', minHeight: '100vh', background: C.bg }}><Text style={{ color: C.secondary, fontSize: '28rpx' }}>加载中...</Text></View>
  }

  if (error && qrStatus === 'EXPIRED' && !code) {
    return (
      <View style={{ padding: '120rpx 32rpx', textAlign: 'center', minHeight: '100vh', background: C.bg }}>
        <Text style={{ display: 'block', fontSize: '32rpx', color: C.body, marginBottom: '16rpx' }}>{error}</Text>
        <Button onClick={() => load(activityId)} style={{ height: '88rpx', borderRadius: '999rpx', background: C.green, color: '#FFFFFF', fontSize: '30rpx', lineHeight: '88rpx', border: 'none', padding: '0 48rpx' }}>重试</Button>
      </View>
    )
  }

  return (
    <View style={{ minHeight: '100vh', background: C.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif' }}>

      {/* ── Status banner ── */}
      {qrStatus === 'ACTIVE' && (
        <View style={{ margin: '24rpx 32rpx 0', padding: '20rpx 24rpx', background: C.lightGreen, borderRadius: '16rpx', border: '1rpx solid rgba(46,125,90,0.12)' }}>
          <Text style={{ fontSize: '26rpx', color: C.green, textAlign: 'center', display: 'block' }}>✓ 二维码有效 — 请出示给工作人员</Text>
        </View>
      )}
      {qrStatus === 'CHECKED_IN' && (
        <View style={{ margin: '24rpx 32rpx 0', padding: '20rpx 24rpx', background: '#F1F1EE', borderRadius: '16rpx', border: '1rpx solid #D9D9D2' }}>
          <Text style={{ fontSize: '26rpx', color: C.secondary, textAlign: 'center', display: 'block' }}>你已完成本次活动签到</Text>
        </View>
      )}
      {qrStatus === 'EXPIRED' && (
        <View style={{ margin: '24rpx 32rpx 0', padding: '20rpx 24rpx', background: 'rgba(179,91,75,0.05)', borderRadius: '16rpx', border: '1rpx solid rgba(179,91,75,0.1)' }}>
          <Text style={{ fontSize: '26rpx', color: '#B35B4B', textAlign: 'center', display: 'block' }}>✗ 二维码已失效</Text>
        </View>
      )}

      {/* ── Page title ── */}
      <View style={{ padding: '36rpx 32rpx 0', textAlign: 'center' }}>
        <Text style={{ fontSize: '40rpx', fontWeight: '700', color: C.dark, display: 'block', lineHeight: '1.3' }}>活动签到码</Text>
        <Text style={{ fontSize: '26rpx', color: C.neutral, display: 'block', marginTop: '8rpx' }}>请在现场出示二维码完成签到</Text>
      </View>

      {/* ── Activity info card ── */}
      <View style={{ margin: '24rpx 32rpx', background: C.white, borderRadius: '24rpx', padding: '24rpx 28rpx', border: '1rpx solid #EDE9DF', boxShadow: '0 8rpx 24rpx rgba(24,35,30,0.05)' }}>
        <Text style={{ fontSize: '30rpx', fontWeight: '700', color: C.dark, display: 'block' }}>{title}</Text>
        {(startTime || location) && (
          <View style={{ marginTop: '16rpx' }}>
            {startTime && <Text style={{ fontSize: '24rpx', color: C.neutral, display: 'block', lineHeight: '1.5' }}>📅 {fmtDate(startTime)}</Text>}
            {location && <Text style={{ fontSize: '24rpx', color: C.neutral, display: 'block', lineHeight: '1.5', marginTop: startTime ? '6rpx' : 0 }}>📍 {location}</Text>}
          </View>
        )}
        <View style={{ marginTop: '16rpx', padding: '4rpx 14rpx', background: C.lightGreen, borderRadius: '999rpx', alignSelf: 'flex-start', display: 'inline-block' }}>
          <Text style={{ fontSize: '22rpx', color: C.green }}>{qrStatus === 'ACTIVE' ? '有效' : qrStatus === 'CHECKED_IN' ? '已签到' : '已失效'}</Text>
        </View>
      </View>

      {/* ── QR code card ── */}
      <View style={{ margin: '0 32rpx 0', background: C.white, borderRadius: '28rpx', padding: '40rpx 32rpx', border: '1rpx solid #EDE9DF', boxShadow: '0 12rpx 32rpx rgba(24,35,30,0.08)', textAlign: 'center' }}>
        <View style={{ width: '360rpx', height: '360rpx', background: '#FBFAF6', borderRadius: '20rpx', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {qrStatus === 'ACTIVE' && code && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexWrap: 'wrap', padding: '28rpx', alignItems: 'center', justifyContent: 'center' }}>
              {Array.from({ length: 36 }).map((_, i) => (
                <View key={i} style={{ width: '34rpx', height: '34rpx', margin: '5rpx', background: (i + Number(code.charCodeAt(i % code.length) || 0)) % 3 === 0 ? C.dark : 'rgba(24,35,30,0.12)', borderRadius: '4rpx' }} />
              ))}
            </View>
          )}
          {qrStatus === 'CHECKED_IN' && (
            <View style={{ textAlign: 'center' }}>
              <Text style={{ fontSize: '56rpx', color: C.secondary, display: 'block' }}>✓</Text>
              <Text style={{ fontSize: '22rpx', color: C.secondary, display: 'block', marginTop: '8rpx' }}>已签到</Text>
            </View>
          )}
          {qrStatus === 'EXPIRED' && (
            <View style={{ textAlign: 'center' }}>
              <Text style={{ fontSize: '48rpx', color: C.secondary, display: 'block' }}>✗</Text>
              <Text style={{ fontSize: '22rpx', color: C.secondary, display: 'block', marginTop: '8rpx' }}>已失效</Text>
            </View>
          )}
        </View>
        {code && (
          <Text style={{ fontSize: '22rpx', fontFamily: 'monospace', color: C.secondary, wordBreak: 'break-all', marginTop: '20rpx', display: 'block' }}>签到码：{code.slice(0, 8)}...</Text>
        )}
      </View>

      {/* ── Notice ── */}
      {qrStatus === 'ACTIVE' && (
        <View style={{ margin: '24rpx 32rpx 0', padding: '22rpx 24rpx', background: C.lightGreen, borderRadius: '18rpx', border: '1rpx solid rgba(46,125,90,0.08)' }}>
          <Text style={{ fontSize: '25rpx', color: C.green, lineHeight: '1.5' }}>现场工作人员扫码后，二维码将自动变为已签到状态。</Text>
        </View>
      )}

      {/* ── Actions ── */}
      <View style={{ padding: '40rpx 32rpx', textAlign: 'center' }}>
        {qrStatus === 'ACTIVE' && (
          <Button onClick={doCheckin} disabled={acting}
            style={{ width: '100%', height: '92rpx', borderRadius: '999rpx', background: C.dark, color: '#FFFFFF', fontSize: '32rpx', fontWeight: '600', lineHeight: '92rpx', border: 'none' }}
          >{acting ? '...' : '模拟签到'}</Button>
        )}
        {/* V2.5C: group QR entry */}
        {groupQr && (
          <Button onClick={() => setShowGroupQr(true)}
            style={{ marginTop: qrStatus === 'ACTIVE' ? '20rpx' : '0', width: '100%', height: '88rpx', borderRadius: '999rpx', background: C.lightGreen, border: `1rpx solid ${C.border}`, color: C.green, fontSize: '28rpx', lineHeight: '88rpx' }}
          >加入活动群</Button>
        )}
        <Button onClick={() => Taro.navigateBack()}
          style={{ marginTop: '24rpx', width: '100%', height: '88rpx', borderRadius: '999rpx', background: C.white, border: '1rpx solid #EDE9DF', color: C.dark, fontSize: '30rpx', lineHeight: '88rpx' }}
        >返回活动详情</Button>
      </View>

      {/* V2.5C: Group QR modal */}
      {showGroupQr && groupQr && (
        <View style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowGroupQr(false)}>
          <View style={{ width: '560rpx', background: C.white, borderRadius: '24rpx', padding: '36rpx 32rpx 28rpx', boxShadow: '0 16rpx 48rpx rgba(0,0,0,0.16)' }} onClick={(e) => e.stopPropagation()}>
            <View style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8rpx' }}>
              <View onClick={() => setShowGroupQr(false)} style={{ width: '48rpx', height: '48rpx', borderRadius: '50%', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: '30rpx', color: C.neutral }}>×</Text>
              </View>
            </View>
            <Text style={{ fontSize: '30rpx', fontWeight: '700', color: C.dark, textAlign: 'center', display: 'block' }}>{groupQr.title}</Text>
            <Text style={{ fontSize: '25rpx', color: C.neutral, textAlign: 'center', display: 'block', marginTop: '8rpx' }}>{groupQr.desc}</Text>
            <View style={{ textAlign: 'center', marginTop: '20rpx' }}>
              <Image src={groupQr.imageUrl} mode='widthFix' style={{ width: '300rpx', borderRadius: '12rpx' }} onError={(e) => { (e.target as any).style.display = 'none' }} />
            </View>
            <View style={{ marginTop: '12rpx', padding: '12rpx', background: C.lightGreen, borderRadius: '8rpx' }}>
              <Text style={{ fontSize: '24rpx', color: C.neutral, textAlign: 'center', display: 'block' }}>长按识别二维码加入活动群</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
