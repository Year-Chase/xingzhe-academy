import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { getUserId } from '../../../utils/user'

const API = 'http://172.20.10.10:3000'

const C = {
  bg: '#F7F6F2', card: '#FFFFFF', ink: '#18231E', body: '#3E463F',
  muted: '#8C918C', line: '#E6ECE7', green: '#3F6B4F', softGreen: '#EEF5EF',
}

interface ActivityItem {
  activityId: number; title: string; province: string; city: string
  startTime: string; endTime: string; coverImage: string
  isCompleted: boolean; isCheckedIn: boolean
  companionCount: number; certificateStatus: string
}

export default function RegistrationsPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    const uid = getUserId()
    if (!uid) { setError('请先完成登录'); setLoading(false); return }
    setLoading(true); setError('')
    try {
      const res = await Taro.request({ url: `${API}/users/${uid}/journey` })
      setActivities(((res.data as any)?.activities || []) as ActivityItem[])
    } catch (e) { console.error('[mine-registrations]', e); setError('加载失败') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const fmtDate = (s: string) => { if (!s) return ''; const d = new Date(s); return `${d.getMonth()+1}月${d.getDate()}日` }
  const goDetail = (id: number) => Taro.navigateTo({ url: `/pages/activity/detail/index?id=${id}` })
  const goHome = () => Taro.switchTab({ url: '/pages/index/index' })

  if (loading) return <View style={fullC}><Text style={{ fontSize: '28rpx', color: C.muted }}>加载中...</Text></View>
  if (error) return <View style={{ ...fullC, flexDirection: 'column', padding: '48rpx' }}><Text style={{ fontSize: '30rpx', color: C.ink, display: 'block', marginBottom: '16rpx' }}>{error}</Text></View>

  if (activities.length === 0) {
    return (
      <View style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48rpx' }}>
        <Text style={{ fontSize: '32rpx', fontWeight: '700', color: C.ink, textAlign: 'center', display: 'block', marginBottom: '12rpx' }}>你还没有报名活动。</Text>
        <View onClick={goHome} style={btnStyle}><Text style={{ color: '#FFFFFF', fontSize: '28rpx' }}>去看看活动</Text></View>
      </View>
    )
  }

  return (
    <ScrollView scrollY style={{ height: '100vh', background: C.bg }}>
      <View style={{ padding: '16rpx 24rpx', paddingBottom: '80rpx' }}>
        {activities.map(a => (
          <View key={a.activityId} onClick={() => goDetail(a.activityId)}
            style={{ marginBottom: '16rpx', background: C.card, borderRadius: '20rpx', padding: '20rpx', border: `1rpx solid ${C.line}`, display: 'flex', flexDirection: 'row' }}>
            <View style={{ width: '120rpx', height: '120rpx', borderRadius: '12rpx', background: C.softGreen, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {a.coverImage ? <Image src={a.coverImage.startsWith('http') ? a.coverImage : `${API}${a.coverImage}`} mode='aspectFill' style={{ width: '100%', height: '100%' }} /> : <Text style={{ fontSize: '40rpx' }}>⛰️</Text>}
            </View>
            <View style={{ flex: 1, marginLeft: '16rpx', minWidth: 0 }}>
              <Text style={{ fontSize: '28rpx', fontWeight: '600', color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</Text>
              <Text style={{ fontSize: '22rpx', color: C.muted, marginTop: '4rpx' }}>{a.province}{a.city ? ' · ' + a.city : ''} · {fmtDate(a.startTime)}</Text>
              <View style={{ marginTop: '8rpx', display: 'flex', gap: '10rpx' }}>
                {a.isCheckedIn ? <Tag label='已签到' color={C.green} bg={C.softGreen} /> : a.isCompleted ? <Tag label='已完成' color='#C98255' bg='#FDF1E7' /> : <Tag label='已报名' color={C.green} bg={C.softGreen} />}
                {a.certificateStatus === 'AVAILABLE' ? <Tag label='有证书' color={C.green} bg={C.softGreen} /> : null}
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

function Tag({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <View style={{ padding: '4rpx 12rpx', background: bg, borderRadius: '999rpx' }}><Text style={{ fontSize: '20rpx', color }}>{label}</Text></View>
}

const fullC: React.CSSProperties = { minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const btnStyle: React.CSSProperties = { padding: '16rpx 48rpx', background: C.green, borderRadius: '999rpx', display: 'flex', alignItems: 'center', justifyContent: 'center' }
