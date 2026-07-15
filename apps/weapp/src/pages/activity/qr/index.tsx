import { View, Text, Button, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState, useEffect, useCallback } from 'react'
import qrcode from 'qrcode-generator'
import { userAuthHeader } from '../../../utils/user'
import { canOpenActivityLocation, openActivityLocation } from '../../../utils/location'

import { API_BASE_URL as API } from '../../../config/api'
import navigationIcon from '../../../assets/icons/navigation-user-provided.png'

type QRState = 'ACTIVE' | 'CHECKED_IN' | 'EXPIRED' | 'loading'

const C = {
  bg: '#F7F6F2', white: '#FFFFFF', green: '#3F6B4F', dark: '#18231E',
  body: '#3E463F', neutral: '#7A8178', secondary: '#A6AAA2',
  lightGreen: '#EEF5EF', border: '#EDE9DF', disabledBg: '#E9EAE5',
}

function buildQrMatrix(value: string): boolean[][] {
  if (!value) return []
  const qr = qrcode(0, 'M')
  qr.addData(value)
  qr.make()
  const count = qr.getModuleCount()
  return Array.from({ length: count }, (_, row) =>
    Array.from({ length: count }, (_, col) => qr.isDark(row, col)),
  )
}

export default function QRPage() {
  const router = useRouter()
  const [activityId, setActivityId] = useState(0)
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [qrStatus, setQrStatus] = useState<QRState>('loading')
  const [error, setError] = useState('')
  const [location, setLocation] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [activity, setActivity] = useState<any>(null)
  // V2.5C: group QR
  const [groupQr, setGroupQr] = useState<any>(null)
  const [showGroupQr, setShowGroupQr] = useState(false)

  // V2.5.1: activity finished check
  const [isFinished, setIsFinished] = useState(false)

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
    setQrStatus('loading'); setError(''); setCode(''); setExpiresAt(''); setIsFinished(false)
    try {
      const detail = await Taro.request({ url: `${API}/activity/${id}` })
      const d = detail.data as any
      setTitle(d.title || title)
      setLocation(d.location || '')
      setStartTime(d.startTime || '')
      setEndTime(d.endTime || '')
      setActivity(d)
      // V2.5.1: check if finished
      if (d.endTime && new Date(d.endTime).getTime() < Date.now()) setIsFinished(true)
      // V2.5C: capture group QR info
      if (d.groupQrType && d.groupQrType !== 'NONE' && d.groupQrImageUrl) {
        setGroupQr({ type: d.groupQrType, imageUrl: d.groupQrImageUrl, title: d.groupQrTitle || '加入活动群', desc: d.groupQrDescription || '活动通知、集合安排和现场事项将在群内同步' })
      }
      try {
        const qr = await Taro.request({ url: `${API}/activity/${id}/qr`, header: userAuthHeader() })
        const q = qr.data as any
        setCode(q.code || '')
        setExpiresAt(q.expiresAt || '')
        if (q.status === 'ACTIVE') { setQrStatus('ACTIVE') }
        else if (q.status === 'CHECKED_IN') { setQrStatus('CHECKED_IN') }
        else {
          const s = await Taro.request({ url: `${API}/activity/${id}/status`, header: userAuthHeader() })
          const st = (s.data as any)?.status
          setQrStatus(st === 'CHECKED_IN' ? 'CHECKED_IN' : 'EXPIRED')
        }
      } catch (qrError) {
        const s = await Taro.request({ url: `${API}/activity/${id}/status`, header: userAuthHeader() })
        const st = (s.data as any)?.status
        if (st === 'CHECKED_IN') setQrStatus('CHECKED_IN')
        else if (d.endTime && new Date(d.endTime).getTime() < Date.now()) { setError('活动已结束'); setQrStatus('EXPIRED') }
        else if (st === 'EXPIRED') { setError('二维码已过期，请重新加载'); setQrStatus('EXPIRED') }
        else { setError('暂无签到二维码'); setQrStatus('EXPIRED') }
      }
    } catch (e) {
      try {
        const s = await Taro.request({ url: `${API}/activity/${id}/status`, header: userAuthHeader() })
        const st = (s.data as any)?.status
        if (st === 'CHECKED_IN') setQrStatus('CHECKED_IN')
        else if (st === 'EXPIRED') { setError('二维码已过期，请重新加载'); setQrStatus('EXPIRED') }
        else { setError('暂无签到二维码'); setQrStatus('EXPIRED') }
      } catch (e2) { setError('加载失败'); setQrStatus('EXPIRED') }
    }
  }, [])

  // checkin is done by Admin via /admin/activity/:id/checkin — no user self-checkin

  const fmtDate = (d: string) => {
    if (!d) return ''; const dt = new Date(d)
    const w = ['日', '一', '二', '三', '四', '五', '六'][dt.getDay()]
    return `${dt.getMonth() + 1}月${dt.getDate()}日（周${w}） ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
  }
  const qrMatrix = qrStatus === 'ACTIVE' && code ? buildQrMatrix(code) : []

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
        <Button onClick={() => load(activityId)} style={{ height: '88rpx', borderRadius: '999rpx', background: C.green, color: '#FFFFFF', fontSize: '30rpx', lineHeight: '88rpx', border: 'none', padding: '0 48rpx' }}>重新加载</Button>
      </View>
    )
  }

  return (
    <View style={{ minHeight: '100vh', background: C.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif' }}>

      {/* ── V2.5.1: Finished banner ── */}
      {isFinished && (
        <View style={{ margin: '24rpx 32rpx 0', padding: '20rpx 24rpx', background: '#F1F1EE', borderRadius: '16rpx', border: '1rpx solid #D9D9D2' }}>
          <Text style={{ fontSize: '26rpx', color: C.secondary, textAlign: 'center', display: 'block' }}>活动已结束</Text>
        </View>
      )}
      {/* ── Status banner ── */}
      {!isFinished && qrStatus === 'ACTIVE' && (
        <View style={{ margin: '24rpx 32rpx 0', padding: '20rpx 24rpx', background: C.lightGreen, borderRadius: '16rpx', border: '1rpx solid rgba(46,125,90,0.12)' }}>
          <Text style={{ fontSize: '26rpx', color: C.green, textAlign: 'center', display: 'block' }}>请向工作人员出示签到二维码</Text>
        </View>
      )}
      {!isFinished && qrStatus === 'CHECKED_IN' && (
        <View style={{ margin: '24rpx 32rpx 0', padding: '20rpx 24rpx', background: '#F1F1EE', borderRadius: '16rpx', border: '1rpx solid #D9D9D2' }}>
          <Text style={{ fontSize: '26rpx', color: C.secondary, textAlign: 'center', display: 'block' }}>你已完成本次活动签到</Text>
        </View>
      )}
      {!isFinished && qrStatus === 'EXPIRED' && (
        <View style={{ margin: '24rpx 32rpx 0', padding: '20rpx 24rpx', background: 'rgba(179,91,75,0.05)', borderRadius: '16rpx', border: '1rpx solid rgba(179,91,75,0.1)' }}>
          <Text style={{ fontSize: '26rpx', color: '#B35B4B', textAlign: 'center', display: 'block' }}>{isFinished ? '活动已结束' : '二维码已过期，请重新加载'}</Text>
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
        {/* Activity time — start + end with same-day dedup */}
        {(startTime || endTime) && (
          <View style={{ marginTop: '16rpx' }}>
            <Text style={{ fontSize: '24rpx', color: C.neutral, display: 'block', lineHeight: '1.5' }}>
              📅 {(() => {
                if (!startTime) return '活动时间待确认'
                const pad = (n: number) => String(n).padStart(2, '0')
                const fmtDT = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
                const fmtT = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
                const sd = new Date(startTime)
                if (isNaN(sd.getTime())) return '活动时间待确认'
                if (!endTime) return fmtDT(sd)
                const ed = new Date(endTime)
                if (isNaN(ed.getTime())) return fmtDT(sd)
                const sameDay = sd.getFullYear() === ed.getFullYear() && sd.getMonth() === ed.getMonth() && sd.getDate() === ed.getDate()
                return sameDay ? `${fmtDT(sd)} - ${fmtT(ed)}` : `${fmtDT(sd)} - ${fmtDT(ed)}`
              })()}
            </Text>
          </View>
        )}
        {/* Location row — full-row clickable with navigation icon */}
        {(activity as any)?.locationName || location ? (
          <View onClick={() => { if (canOpenActivityLocation(activity)) openActivityLocation(activity); else Taro.showToast({ title: '暂无可导航定位', icon: 'none' }) }}
            style={{ marginTop: (startTime || endTime) ? '10rpx' : '16rpx', display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ flex: 1, fontSize: '24rpx', color: C.neutral, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              📍 {(activity as any)?.locationName || location || '活动地点待确认'}
            </Text>
            <Image src={navigationIcon} mode='aspectFit' style={{ width: '38rpx', height: '38rpx', marginLeft: '10rpx', flexShrink: 0 }} />
          </View>
        ) : null}
        <View style={{ marginTop: '16rpx', padding: '4rpx 14rpx', background: C.lightGreen, borderRadius: '999rpx', alignSelf: 'flex-start', display: 'inline-block' }}>
          <Text style={{ fontSize: '22rpx', color: C.green }}>{qrStatus === 'ACTIVE' ? '有效' : qrStatus === 'CHECKED_IN' ? '已签到' : isFinished ? '活动已结束' : '已过期'}</Text>
        </View>
      </View>

      {/* ── QR code card ── */}
      <View style={{ margin: '0 32rpx 0', background: C.white, borderRadius: '28rpx', padding: '40rpx 32rpx', border: '1rpx solid #EDE9DF', boxShadow: '0 12rpx 32rpx rgba(24,35,30,0.08)', textAlign: 'center' }}>
        <View style={{ width: '400rpx', height: '400rpx', background: '#FFFFFF', borderRadius: '20rpx', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', border: '1rpx solid #EDE9DF' }}>
          {qrStatus === 'ACTIVE' && qrMatrix.length > 0 && (
            <View style={{ width: '336rpx', height: '336rpx', background: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
              {qrMatrix.map((row, rowIndex) => (
                <View key={rowIndex} style={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
                  {row.map((dark, colIndex) => (
                    <View key={`${rowIndex}-${colIndex}`} style={{ flex: 1, background: dark ? '#000000' : '#FFFFFF' }} />
                  ))}
                </View>
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
              <Text style={{ fontSize: '22rpx', color: C.secondary, display: 'block', marginTop: '8rpx' }}>{isFinished ? '活动已结束' : '已过期'}</Text>
            </View>
          )}
        </View>
        {qrStatus === 'ACTIVE' && expiresAt && (
          <Text style={{ fontSize: '24rpx', color: C.secondary, display: 'block', marginTop: '20rpx' }}>
            有效期至 {fmtDate(expiresAt)}
          </Text>
        )}
        {qrStatus === 'EXPIRED' && !isFinished && (
          <Button onClick={() => load(activityId)}
            style={{ marginTop: '24rpx', height: '76rpx', borderRadius: '999rpx', background: C.green, color: '#FFFFFF', fontSize: '28rpx', lineHeight: '76rpx', border: 'none', padding: '0 42rpx' }}
          >重新加载</Button>
        )}
      </View>

      {/* ── Notice ── */}
      {!isFinished && qrStatus === 'ACTIVE' && (
        <View style={{ margin: '24rpx 32rpx 0', padding: '22rpx 24rpx', background: C.lightGreen, borderRadius: '18rpx', border: '1rpx solid rgba(46,125,90,0.08)' }}>
          <Text style={{ fontSize: '25rpx', color: C.green, lineHeight: '1.5' }}>现场工作人员扫码后，二维码将自动变为已签到状态。</Text>
        </View>
      )}

      {/* ── Actions ── */}
      <View style={{ padding: '40rpx 32rpx', textAlign: 'center' }}>
        {/* V2.5C: group QR entry — disabled if finished */}
        {groupQr && (
          <Button onClick={() => { if (!isFinished) setShowGroupQr(true) }}
            style={{ marginTop: qrStatus === 'ACTIVE' ? '20rpx' : '0', width: '100%', height: '88rpx', borderRadius: '999rpx', background: isFinished ? C.disabledBg : C.lightGreen, border: `1rpx solid ${C.border}`, color: isFinished ? C.disabledText : C.green, fontSize: '28rpx', lineHeight: '88rpx' }}
          >{isFinished ? '活动群入口已关闭' : '加入活动群'}</Button>
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
