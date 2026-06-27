import { View, Text, Button } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { loginWithPhone } from '../../../utils/user'

const C = {
  bg: '#F7F6F2', white: '#FFFFFF', green: '#3F6B4F', dark: '#18231E',
  body: '#3E463F', neutral: '#7A8178', secondary: '#A6AAA2',
  lightGreen: '#EEF5EF', border: '#EDE9DF',
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGetPhoneNumber = async (e: any) => {
    const detail = e?.detail || {}

    // User denied authorization
    if (!detail.code && !detail.encryptedData) {
      setError('请授权手机号后继续')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await loginWithPhone({
        phoneCode: detail.code || undefined,
        encryptedData: detail.encryptedData || undefined,
        iv: detail.iv || undefined,
      })

      if (result) {
        Taro.showToast({ title: '登录成功', icon: 'success', duration: 1200 })
        setTimeout(() => Taro.switchTab({ url: '/pages/mine/index' }), 800)
      } else {
        setError('登录失败，请重试')
      }
    } catch (e) {
      console.error('[auth-login]', e)
      setError('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', padding: '48rpx 32rpx' }}>
      {/* Brand */}
      <View style={{ textAlign: 'center', marginBottom: '80rpx', marginTop: '120rpx' }}>
        <Text style={{ fontSize: '48rpx', fontWeight: '700', color: C.dark, display: 'block' }}>行者学社</Text>
        <Text style={{ fontSize: '28rpx', color: C.neutral, display: 'block', marginTop: '24rpx', lineHeight: '1.6' }}>
          登录后查看你的报名、证书和行者之路
        </Text>
      </View>

      {/* Phone auth button */}
      <View style={{ background: C.white, borderRadius: '24rpx', padding: '48rpx 32rpx', border: `1rpx solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Button
          openType='getPhoneNumber'
          onGetPhoneNumber={handleGetPhoneNumber}
          disabled={loading}
          style={{
            width: '100%',
            height: '96rpx',
            borderRadius: '999rpx',
            background: loading ? '#E9EAE5' : C.green,
            color: '#FFFFFF',
            fontSize: '32rpx',
            fontWeight: '600',
            lineHeight: '96rpx',
            border: 'none',
            textAlign: 'center',
          }}
        >
          {loading ? '登录中...' : '手机号授权登录'}
        </Button>
        <Text style={{ fontSize: '24rpx', color: C.secondary, marginTop: '24rpx', textAlign: 'center', lineHeight: '1.6' }}>
          点击上方按钮，授权手机号即可完成登录
        </Text>
      </View>

      {error ? (
        <Text style={{ fontSize: '26rpx', color: '#B35B4B', textAlign: 'center', display: 'block', marginTop: '32rpx' }}>{error}</Text>
      ) : null}
    </View>
  )
}
