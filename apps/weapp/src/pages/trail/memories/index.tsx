import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState, useEffect, useMemo } from 'react'
import Taro from '@tarojs/taro'
import { getUserId, isLoggedIn } from '../../../utils/user'

const API = 'http://172.20.10.10:3000'

const C = {
  bg: '#F7F5F1', card: '#FFFFFF', ink: '#18231E', body: '#4E5A52',
  muted: '#8C918C', line: '#E6ECE7', green: '#3F6B4F', softGreen: '#EEF5EF',
}

interface MemoryData {
  activityId: number; title: string; province: string; city: string
  memoryImages: any; memoryText: string; coverImage: string
}

function safeImgs(raw: any): string[] {
  if (Array.isArray(raw)) return raw.filter((v: any) => typeof v === 'string')
  if (typeof raw !== 'string') return []
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p.filter((v: any) => typeof v === 'string') : [] } catch (e) { console.error('[trail-memories] parse error', e); return [] }
}

export default function MemoriesPage() {
  const [data, setData] = useState<MemoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    if (!isLoggedIn()) { setError('请先完成登录'); setLoading(false); return }
    const uid = getUserId()
    setLoading(true); setError('')
    try {
      const res = await Taro.request({ url: `${API}/users/${uid}/journey` })
      setData(((res.data as any)?.memories || []) as MemoryData[])
    } catch (e) { console.error('[trail-memories]', e); setError('加载失败') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const fmtDate = (s: string) => { if (!s) return ''; const d = new Date(s); return `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()}` }
  const goHome = () => Taro.switchTab({ url: '/pages/index/index' })
  const preview = (urls: string[], current: string) => {
    Taro.previewImage({ urls, current })
  }

  if (loading) return <View style={fullC}><Text style={{ fontSize: '28rpx', color: C.muted }}>加载中...</Text></View>
  if (error) return <View style={{ ...fullC, flexDirection: 'column', padding: '48rpx' }}><Text style={{ fontSize: '30rpx', color: C.ink, display: 'block', marginBottom: '16rpx' }}>{error}</Text><View onClick={load} style={btnStyle}><Text style={{ color: '#FFFFFF', fontSize: '28rpx' }}>重试</Text></View></View>

  if (data.length === 0) {
    return (
      <View style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48rpx' }}>
        <Text style={{ fontSize: '32rpx', fontWeight: '700', color: C.ink, textAlign: 'center', display: 'block', lineHeight: '1.5' }}>活动完成后，{'\n'}回忆图册会在这里被点亮。</Text>
        <View onClick={goHome} style={{ ...btnStyle, marginTop: '32rpx' }}><Text style={{ color: '#FFFFFF', fontSize: '28rpx' }}>去看看活动</Text></View>
      </View>
    )
  }

  return (
    <ScrollView scrollY style={{ height: '100vh', background: C.bg }}>
      <View style={{ padding: '16rpx 24rpx', paddingBottom: '80rpx' }}>
        <Text style={{ fontSize: '34rpx', fontWeight: '700', color: C.ink, display: 'block', marginBottom: '8rpx' }}>回忆图册</Text>
        <Text style={{ fontSize: '24rpx', color: C.muted, display: 'block', marginBottom: '32rpx' }}>那些走过的路，终会留下回响。</Text>

        {data.map(m => {
          const imgs = safeImgs(m.memoryImages)
          return (
            <View key={m.activityId} style={{ marginBottom: '28rpx', background: C.card, borderRadius: '24rpx', padding: '24rpx', border: `1rpx solid ${C.line}` }}>
              <Text style={{ fontSize: '28rpx', fontWeight: '700', color: C.ink, display: 'block' }}>{m.title}</Text>
              <Text style={{ fontSize: '22rpx', color: C.muted, display: 'block', marginTop: '6rpx' }}>{m.province}{m.city ? ' · ' + m.city : ''}{m.memoryText ? ' · ' + m.memoryText.slice(0, 30) : ''}</Text>
              {imgs.length > 0 && (
                <View style={{ marginTop: '16rpx', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10rpx' }}>
                  {imgs.map((img, i) => (
                    <View key={i} onClick={() => preview(imgs, img.startsWith('http') ? img : `${API}${img}`)}
                      style={{ aspectRatio: '1', borderRadius: '16rpx', overflow: 'hidden', background: 'linear-gradient(160deg, #E8E2D8 0%, #DFE8DE 50%, #DCE6E2 100%)' }}>
                      <Image src={img.startsWith('http') ? img : `${API}${img}`} mode='aspectFill' style={{ width: '100%', height: '100%' }} />
                    </View>
                  ))}
                </View>
              )}
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}

const fullC: React.CSSProperties = { minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const btnStyle: React.CSSProperties = { padding: '16rpx 48rpx', background: C.green, borderRadius: '999rpx', display: 'flex', alignItems: 'center', justifyContent: 'center' }
