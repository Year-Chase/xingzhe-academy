import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { isLoggedIn, userAuthHeader } from '../../../utils/user'

import { API_BASE_URL as API } from '../../../config/api'

const C = {
  bg: '#F7F6F2', card: '#FFFFFF', ink: '#18231E', body: '#4E5A52',
  muted: '#8C918C', line: '#E6ECE7', green: '#3F6B4F', softGreen: '#EEF5EF',
}

interface CertItem {
  certificateId: string; activityId: number; recipientName: string; activityTitle: string
  activityDate: string; issuerName: string; certificateImage: string
  province: string; city: string; certificateNo: string; issuedAt: string
}

export default function CertificatesPage() {
  const [certs, setCerts] = useState<CertItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    if (!isLoggedIn()) { Taro.reLaunch({ url: '/pages/auth/login/index' }); return }
    setLoading(true); setError('')
    try {
      const res = await Taro.request({ url: `${API}/users/me/journey`, header: userAuthHeader() })
      const rawCerts = ((res.data as any)?.certificates || []) as CertItem[]
      // Sort by activity end time (issuedAt) desc — same rule as Trail page
      const getSortTime = (c: CertItem) => c.issuedAt || c.activityDate || ''
      const sorted = [...rawCerts].sort((a, b) =>
        new Date(getSortTime(b) || 0).getTime() - new Date(getSortTime(a) || 0).getTime()
      )
      setCerts(sorted)
    } catch (e) { console.error('[mine-certificates]', e); setError('加载失败') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const fmtDate = (s: string) => { if (!s) return ''; const d = new Date(s); return `${d.getMonth()+1}月${d.getDate()}日` }
  const goCert = (certId: string) => Taro.navigateTo({ url: `/pages/journey/certificate/index?certificateId=${certId}` })
  const goHome = () => Taro.switchTab({ url: '/pages/index/index' })

  if (loading) return <View style={fullC}><Text style={{ fontSize:'28rpx', color: C.muted }}>加载中...</Text></View>
  if (error) return <View style={{...fullC, flexDirection:'column', padding:'48rpx'}}><Text style={{fontSize:'30rpx',color:C.ink,marginBottom:'16rpx'}}>{error}</Text><View onClick={load} style={btnStyle}><Text style={{color:'#FFFFFF',fontSize:'28rpx'}}>重试</Text></View></View>

  if (certs.length === 0) return (
    <View style={{minHeight:'100vh',background:C.bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'48rpx'}}>
      <Text style={{fontSize:'32rpx',fontWeight:'700',color:C.ink,textAlign:'center',display:'block',marginBottom:'12rpx'}}>你还没有获得证书。</Text>
      <Text style={{fontSize:'26rpx',color:C.muted,textAlign:'center',display:'block',marginBottom:'32rpx'}}>完成一次活动后，这里会留下你的行者证明。</Text>
      <View onClick={goHome} style={btnStyle}><Text style={{color:'#FFFFFF',fontSize:'28rpx'}}>去看看活动</Text></View>
    </View>
  )

  return (
    <ScrollView scrollY style={{height:'100vh',background:C.bg}}>
      <View style={{padding:'16rpx 24rpx',paddingBottom:'80rpx'}}>
        {certs.map(c => (
          <View key={c.certificateId} onClick={() => goCert(c.certificateId)}
            style={{marginBottom:'16rpx',background:C.card,borderRadius:'20rpx',padding:'20rpx',border:`1rpx solid ${C.line}`,display:'flex',flexDirection:'row'}}>
            <View style={{width:'120rpx',height:'160rpx',borderRadius:'12rpx',background:'linear-gradient(160deg,#E8E2D8 0%,#DFE8DE 50%,#DCE6E2 100%)',flexShrink:0,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
              {c.certificateImage ? <Image src={c.certificateImage.startsWith('http')?c.certificateImage:`${API}${c.certificateImage}`} mode='aspectFill' style={{width:'100%',height:'100%'}} /> : <Text style={{fontSize:'40rpx'}}>🏅</Text>}
            </View>
            <View style={{flex:1,marginLeft:'16rpx',minWidth:0}}>
              <Text style={{fontSize:'28rpx',fontWeight:'600',color:C.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.activityTitle}</Text>
              <Text style={{fontSize:'22rpx',color:C.muted,marginTop:'4rpx'}}>{c.recipientName}</Text>
              <Text style={{fontSize:'20rpx',color:C.muted,marginTop:'4rpx'}}>{c.province}{c.city?' · '+c.city:''} · {fmtDate(c.activityDate)}</Text>
              <Text style={{fontSize:'20rpx',color:C.muted,marginTop:'4rpx'}}>{c.issuerName} · {c.certificateNo}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const fullC: React.CSSProperties = { minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center' }
const btnStyle: React.CSSProperties = { padding:'16rpx 48rpx',background:C.green,borderRadius:'999rpx',display:'flex',alignItems:'center',justifyContent:'center' }
