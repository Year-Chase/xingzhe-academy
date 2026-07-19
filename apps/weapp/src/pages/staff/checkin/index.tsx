import { Picker, View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useEffect, useRef, useState } from 'react'

import { API_BASE_URL as API } from '../../../config/api'
import { formatBeijingDateTime } from '../../../utils/date'
import { userAuthHeader } from '../../../utils/user'

type Stage = 'FULL' | 'PREPAY' | 'POSTPAY'
type ScanMode = 'SINGLE' | 'CONTINUOUS'

type StaffActivity = {
  id: number
  title: string
  startTime?: string | null
  endTime?: string | null
  location?: string | null
  paymentMode?: string | null
  availableStages?: Stage[]
  status?: string
}

type ScanResultState = {
  code: string
  title: string
  message?: string
  activityTitle?: string | null
  nickname?: string | null
  maskedPhone?: string | null
  checkedInAt?: string | null
  warnings?: string[]
  tone: 'success' | 'warning' | 'error' | 'neutral'
}

type StaffCheckinStats = {
  validRegistrations: number
  checkedInCount: number
  uncheckedCount: number
  checkinRate: number
}

const C = {
  bg: '#F7F6F2',
  white: '#FFFFFF',
  green: '#3F6B4F',
  dark: '#18231E',
  body: '#3E463F',
  neutral: '#7A8178',
  secondary: '#A6AAA2',
  border: '#EDE9DF',
  lightGreen: '#EEF5EF',
  danger: '#B35B4B',
  warn: '#A86F2B',
}

const RESULT_TEXT: Record<string, string> = {
  CHECKIN_SUCCESS: '签到成功',
  ALREADY_CHECKED_IN: '该用户已签到',
  INVALID_QR: '无效二维码',
  QR_EXPIRED: '二维码已过期',
  QR_SUPERSEDED: '二维码已更新，请使用最新二维码',
  QR_REVOKED: '二维码已撤销',
  QR_STAGE_MISMATCH: '当前扫码阶段不匹配',
  ACTIVITY_MISMATCH: '二维码不属于当前活动',
  REGISTRATION_NOT_ELIGIBLE: '当前报名不可签到',
  FULLY_REFUNDED: '订单已全额退款，不能签到',
  ACTIVITY_ENDED: '活动已结束',
  FORBIDDEN: '无工作人员权限',
}

const STAGE_LABEL: Record<Stage, string> = {
  FULL: '全款',
  PREPAY: '预付款',
  POSTPAY: '后付款',
}

export default function StaffCheckinPage() {
  const [activities, setActivities] = useState<StaffActivity[]>([])
  const [activityIndex, setActivityIndex] = useState(0)
  const [stage, setStage] = useState<Stage>('FULL')
  const [mode, setMode] = useState<ScanMode>('SINGLE')
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [successCount, setSuccessCount] = useState(0)
  const [activityStats, setActivityStats] = useState<StaffCheckinStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [paused, setPaused] = useState(false)
  const [result, setResult] = useState<ScanResultState | null>(null)
  const scanningRef = useRef(false)

  const selectedActivity = activities[activityIndex]
  const isPrepayActivity = selectedActivity?.paymentMode === 'PREPAY'

  const handleForbidden = () => {
    setPaused(true)
    scanningRef.current = false
    setScanning(false)
    setResult({ code: 'FORBIDDEN', title: RESULT_TEXT.FORBIDDEN, tone: 'error' })
    Taro.showToast({ title: '无工作人员权限', icon: 'none' })
    setTimeout(() => Taro.switchTab({ url: '/pages/mine/index' }), 700)
  }

  const loadActivities = async () => {
    setLoading(true)
    try {
      const res = await Taro.request({
        url: `${API}/staff/checkin/activities`,
        header: userAuthHeader(),
      })
      if (res.statusCode === 401 || res.statusCode === 403) {
        handleForbidden()
        return
      }
      if (res.statusCode < 200 || res.statusCode >= 300) throw new Error((res.data as any)?.message || '活动加载失败')
      const list = Array.isArray(res.data) ? res.data as StaffActivity[] : []
      setActivities(list)
      setActivityIndex(0)
      setStage(list[0]?.paymentMode === 'PREPAY' ? 'PREPAY' : 'FULL')
      if (list[0]?.id) loadActivityStats(list[0].id)
    } catch (e: any) {
      setResult({ code: 'LOAD_ERROR', title: e?.message || '活动加载失败', tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadActivities() }, [])
  useDidShow(() => { loadActivities() })

  const loadActivityStats = async (activityId: number) => {
    setStatsLoading(true)
    try {
      const res = await Taro.request({
        url: `${API}/staff/checkin/statistics/${activityId}`,
        header: userAuthHeader(),
      })
      if (res.statusCode === 401 || res.statusCode === 403) {
        handleForbidden()
        return
      }
      if (res.statusCode < 200 || res.statusCode >= 300) throw new Error((res.data as any)?.message || '统计加载失败')
      setActivityStats(res.data as StaffCheckinStats)
    } catch (_e) {
      setActivityStats(null)
    } finally {
      setStatsLoading(false)
    }
  }

  const onSelectActivity = (index: number) => {
    const activity = activities[index]
    setActivityIndex(index)
    setStage(activity?.paymentMode === 'PREPAY' ? 'PREPAY' : 'FULL')
    setPaused(false)
    setResult(null)
    setSuccessCount(0)
    setActivityStats(null)
    if (activity?.id) loadActivityStats(activity.id)
  }

  const buildResult = (data: any, fallbackCode = 'INVALID_QR'): ScanResultState => {
    const resultCode = String(data?.resultCode || data?.code || fallbackCode)
    const title = RESULT_TEXT[resultCode] || data?.message || '扫码失败'
    return {
      code: resultCode,
      title,
      message: data?.message,
      activityTitle: data?.activityTitle || null,
      nickname: data?.nickname || null,
      maskedPhone: data?.maskedPhone || null,
      checkedInAt: data?.checkedInAt || null,
      warnings: Array.isArray(data?.warnings) ? data.warnings : [],
      tone: resultCode === 'CHECKIN_SUCCESS' ? 'success' : resultCode === 'ALREADY_CHECKED_IN' ? 'warning' : 'error',
    }
  }

  const submitScan = async (code: string): Promise<ScanResultState> => {
    const activity = selectedActivity
    if (!activity) return { code: 'NO_ACTIVITY', title: '请先选择活动', tone: 'warning' }
    const requestStage: Stage = activity.paymentMode === 'PREPAY' ? stage : 'FULL'
    const res = await Taro.request({
      method: 'POST',
      url: `${API}/staff/checkin/scan`,
      data: { activityId: activity.id, stage: requestStage, code },
      header: { 'content-type': 'application/json', ...userAuthHeader() },
    })
    if (res.statusCode === 401 || res.statusCode === 403) {
      handleForbidden()
      return { code: 'FORBIDDEN', title: RESULT_TEXT.FORBIDDEN, tone: 'error' }
    }
    if (res.statusCode < 200 || res.statusCode >= 300) return buildResult(res.data, 'INVALID_QR')
    return buildResult(res.data)
  }

  const startScan = async () => {
    if (scanningRef.current || !selectedActivity) return
    const activity = selectedActivity
    setPaused(false)
    setScanning(true)
    scanningRef.current = true
    try {
      const scanRes = await Taro.scanCode({ onlyFromCamera: false })
      const qrCode = String(scanRes?.result || '').trim()
      if (!qrCode) {
        const next = { code: 'INVALID_QR', title: RESULT_TEXT.INVALID_QR, tone: 'error' as const }
        setResult(next)
        setPaused(mode === 'CONTINUOUS')
        return
      }
      const next = await submitScan(qrCode)
      setResult(next)
      if (next.code === 'CHECKIN_SUCCESS') {
        setSuccessCount(count => count + 1)
        loadActivityStats(activity.id)
        if (mode === 'CONTINUOUS') {
          setTimeout(() => startScan(), 700)
        }
      } else if (mode === 'CONTINUOUS') {
        setPaused(true)
      }
    } catch (e: any) {
      const isCancel = String(e?.errMsg || '').toLowerCase().includes('cancel')
      setResult({
        code: isCancel ? 'SCAN_CANCEL' : 'SCAN_ERROR',
        title: isCancel ? '工作人员取消扫码' : '扫码失败',
        message: isCancel ? '本次扫码已取消' : '请检查网络后重试',
        tone: isCancel ? 'neutral' : 'error',
      })
      if (mode === 'CONTINUOUS' && !isCancel) setPaused(true)
      if (mode === 'CONTINUOUS' && isCancel) setPaused(true)
    } finally {
      scanningRef.current = false
      setScanning(false)
    }
  }

  const resultColor = result?.tone === 'success' ? C.green : result?.tone === 'warning' ? C.warn : result?.tone === 'error' ? C.danger : C.neutral

  return (
    <View style={{ minHeight: '100vh', background: C.bg, padding: '28rpx 28rpx 80rpx', boxSizing: 'border-box' }}>
      <View style={card}>
        <Text style={sectionTitle}>选择活动</Text>
        {activities.length > 0 ? (
          <Picker mode='selector' range={activities.map(item => item.title)} value={activityIndex} onChange={e => onSelectActivity(Number(e.detail.value))}>
            <View style={selectBox}>
              <Text style={{ fontSize: '28rpx', color: C.dark, flex: 1 }}>{selectedActivity?.title}</Text>
              <Text style={{ fontSize: '24rpx', color: C.secondary }}>&gt;</Text>
            </View>
          </Picker>
        ) : (
          <Text style={{ display: 'block', fontSize: '26rpx', color: C.neutral }}>{loading ? '加载活动中...' : '暂无可核销活动'}</Text>
        )}
        {selectedActivity ? (
          <View style={{ marginTop: '16rpx' }}>
            <InfoLine label='时间' value={`${formatBeijingDateTime(selectedActivity.startTime) || '未设置'} - ${formatBeijingDateTime(selectedActivity.endTime) || '未设置'}`} />
            <InfoLine label='地点' value={selectedActivity.location || '未设置'} />
          </View>
        ) : null}
      </View>

      {selectedActivity ? (
        <View style={card}>
          <Text style={sectionTitle}>活动统计</Text>
          {activityStats ? (
            <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '12rpx' }}>
              <Metric label='有效报名' value={String(activityStats.validRegistrations || 0)} />
              <Metric label='已签到' value={String(activityStats.checkedInCount || 0)} />
              <Metric label='未签到' value={String(activityStats.uncheckedCount || 0)} />
              <Metric label='签到率' value={`${(Number(activityStats.checkinRate || 0) * 100).toFixed(1)}%`} />
              <Metric label='本次成功' value={String(successCount)} />
            </View>
          ) : (
            <Text style={{ display: 'block', fontSize: '24rpx', color: C.neutral }}>{statsLoading ? '统计加载中...' : '暂无统计数据'}</Text>
          )}
        </View>
      ) : null}

      {selectedActivity && isPrepayActivity ? (
        <View style={card}>
          <Text style={sectionTitle}>选择阶段</Text>
          <View style={segmented}>
            {(['PREPAY', 'POSTPAY'] as Stage[]).map(item => (
              <View key={item} onClick={() => { setStage(item); setPaused(false); setResult(null) }} style={segmentItem(stage === item)}>
                <Text style={segmentText(stage === item)}>{STAGE_LABEL[item]}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={card}>
        <Text style={sectionTitle}>扫码模式</Text>
        <View style={segmented}>
          <View onClick={() => { setMode('SINGLE'); setPaused(false); setSuccessCount(0); setResult(null) }} style={segmentItem(mode === 'SINGLE')}>
            <Text style={segmentText(mode === 'SINGLE')}>单次扫码</Text>
          </View>
          <View onClick={() => { setMode('CONTINUOUS'); setPaused(false); setSuccessCount(0); setResult(null) }} style={segmentItem(mode === 'CONTINUOUS')}>
            <Text style={segmentText(mode === 'CONTINUOUS')}>连续扫码</Text>
          </View>
        </View>
        {mode === 'CONTINUOUS' ? (
          <Text style={{ display: 'block', marginTop: '18rpx', fontSize: '28rpx', fontWeight: '700', color: C.green }}>本次成功签到人数：{successCount}</Text>
        ) : null}
      </View>

      <View style={card}>
        <View onClick={startScan} style={primaryButton(!selectedActivity || scanning)}>
          <Text style={{ fontSize: '30rpx', fontWeight: '700', color: '#FFFFFF' }}>{scanning ? '扫码中...' : paused ? '继续扫码' : '开始扫码'}</Text>
        </View>
        {mode === 'CONTINUOUS' ? (
          <View onClick={() => { setPaused(false); setResult(null); setSuccessCount(0) }} style={ghostButton}>
            <Text style={{ fontSize: '28rpx', color: C.green }}>结束本次扫码</Text>
          </View>
        ) : null}
      </View>

      {result ? (
        <View style={{ ...card, borderColor: resultColor }}>
          <Text style={{ display: 'block', fontSize: '34rpx', fontWeight: '700', color: resultColor }}>{result.title}</Text>
          {result.message && result.message !== result.title ? <Text style={mutedText}>{result.message}</Text> : null}
          {result.activityTitle ? <InfoLine label='活动' value={result.activityTitle} /> : null}
          {result.nickname ? <InfoLine label='用户' value={result.nickname} /> : null}
          {result.maskedPhone ? <InfoLine label='手机号' value={result.maskedPhone} /> : null}
          {result.checkedInAt ? <InfoLine label='签到时间' value={formatBeijingDateTime(result.checkedInAt) || result.checkedInAt} /> : null}
          {(result.warnings || []).map(item => (
            <Text key={item} style={{ display: 'block', marginTop: '10rpx', fontSize: '24rpx', color: C.warn }}>{item}</Text>
          ))}
        </View>
      ) : null}
    </View>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginTop: '10rpx', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: '24rpx', color: C.neutral }}>{label}</Text>
      <Text style={{ fontSize: '24rpx', color: C.body, maxWidth: '460rpx', textAlign: 'right' }}>{value}</Text>
    </View>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ width: 'calc(50% - 6rpx)', minHeight: '96rpx', borderRadius: '14rpx', background: C.lightGreen, padding: '14rpx', boxSizing: 'border-box' }}>
      <Text style={{ display: 'block', fontSize: '22rpx', color: C.neutral }}>{label}</Text>
      <Text style={{ display: 'block', marginTop: '6rpx', fontSize: '32rpx', fontWeight: '700', color: C.dark }}>{value}</Text>
    </View>
  )
}

const card: React.CSSProperties = { marginBottom: '22rpx', background: C.white, borderRadius: '24rpx', border: `1rpx solid ${C.border}`, padding: '28rpx', boxSizing: 'border-box' }
const sectionTitle: React.CSSProperties = { display: 'block', marginBottom: '18rpx', fontSize: '30rpx', fontWeight: '700', color: C.dark }
const selectBox: React.CSSProperties = { minHeight: '76rpx', borderRadius: '16rpx', background: C.lightGreen, padding: '0 22rpx', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }
const segmented: React.CSSProperties = { display: 'flex', flexDirection: 'row', gap: '12rpx' }
const segmentItem = (active: boolean): React.CSSProperties => ({ flex: 1, height: '72rpx', borderRadius: '999rpx', border: `1rpx solid ${active ? C.green : C.border}`, background: active ? C.lightGreen : C.white, display: 'flex', alignItems: 'center', justifyContent: 'center' })
const segmentText = (active: boolean): React.CSSProperties => ({ fontSize: '26rpx', fontWeight: active ? '700' : '400', color: active ? C.green : C.neutral })
const primaryButton = (disabled: boolean): React.CSSProperties => ({ height: '88rpx', borderRadius: '999rpx', background: disabled ? '#C8CCC4' : C.green, display: 'flex', alignItems: 'center', justifyContent: 'center' })
const ghostButton: React.CSSProperties = { marginTop: '18rpx', height: '76rpx', borderRadius: '999rpx', border: `1rpx solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const mutedText: React.CSSProperties = { display: 'block', marginTop: '10rpx', fontSize: '24rpx', color: C.neutral }
