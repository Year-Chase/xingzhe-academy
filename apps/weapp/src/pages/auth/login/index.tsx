import { View, Text, Button, Image, Input } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { loginWithPhone, updateUserProfile, uploadUserAvatar } from '../../../utils/user'

const C = {
  bg: '#F7F6F2', white: '#FFFFFF', green: '#3F6B4F', dark: '#18231E',
  body: '#3E463F', neutral: '#7A8178', secondary: '#A6AAA2',
  lightGreen: '#EEF5EF', border: '#EDE9DF',
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showProfileConfirm, setShowProfileConfirm] = useState(false)
  const [avatarTemp, setAvatarTemp] = useState('')
  const [nickname, setNickname] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const enterMine = () => Taro.switchTab({ url: '/pages/mine/index' })

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
        setNickname(result.profile?.nickname || '')
        setAvatarTemp('')
        setShowProfileConfirm(true)
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

  const handleChooseAvatar = (e: any) => {
    const avatarUrl = e?.detail?.avatarUrl
    if (avatarUrl) setAvatarTemp(avatarUrl)
  }

  const saveProfile = async () => {
    if (savingProfile) return
    setSavingProfile(true)
    try {
      const body: Record<string, any> = {}
      if (nickname.trim()) body.nickname = nickname.trim()
      if (avatarTemp) body.avatarUrl = await uploadUserAvatar(avatarTemp)
      if (Object.keys(body).length > 0) await updateUserProfile(body)
      Taro.showToast({ title: '保存成功', icon: 'success', duration: 900 })
      setTimeout(enterMine, 700)
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '保存失败', icon: 'none' })
    } finally {
      setSavingProfile(false)
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

      {showProfileConfirm && (
        <View style={{ position: 'fixed', left: 0, right: 0, top: 0, bottom: 0, background: 'rgba(0,0,0,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48rpx', zIndex: 20 }}>
          <View style={{ width: '100%', background: C.white, borderRadius: '28rpx', padding: '40rpx 32rpx', border: `1rpx solid ${C.border}` }}>
            <Text style={{ display: 'block', fontSize: '34rpx', fontWeight: '700', color: C.dark, textAlign: 'center' }}>完善头像和昵称</Text>
            <Text style={{ display: 'block', fontSize: '26rpx', color: C.neutral, textAlign: 'center', marginTop: '12rpx', lineHeight: '1.6' }}>用于活动同行者展示和证书展示</Text>

            <View style={{ display: 'flex', justifyContent: 'center', marginTop: '32rpx' }}>
              <View style={{ width: '132rpx', height: '132rpx', borderRadius: '50%', background: C.lightGreen, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {avatarTemp ? <Image src={avatarTemp} mode='aspectFill' style={{ width: '100%', height: '100%' }} /> : <Text style={{ fontSize: '40rpx', color: C.secondary }}>头像</Text>}
              </View>
            </View>

            <Button openType='chooseAvatar' onChooseAvatar={handleChooseAvatar} style={{ marginTop: '24rpx', height: '72rpx', lineHeight: '72rpx', borderRadius: '999rpx', border: `1rpx solid ${C.border}`, background: C.white, color: C.green, fontSize: '28rpx' }}>
              选择微信头像
            </Button>

            <View style={{ marginTop: '20rpx', border: `1rpx solid ${C.border}`, borderRadius: '18rpx', padding: '0 24rpx', background: '#FBFAF6' }}>
              <Input type='nickname' value={nickname} onInput={e => setNickname(e.detail.value)} placeholder='请输入昵称' maxlength={50} style={{ height: '80rpx', fontSize: '28rpx', color: C.dark }} />
            </View>

            <View onClick={saveProfile} style={{ marginTop: '28rpx', height: '84rpx', borderRadius: '999rpx', background: savingProfile ? '#E9EAE5' : C.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: '30rpx', fontWeight: '600', color: '#FFFFFF' }}>{savingProfile ? '保存中...' : '确认保存'}</Text>
            </View>
            <View onClick={enterMine} style={{ marginTop: '18rpx', height: '72rpx', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: '28rpx', color: C.neutral }}>暂不填写</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
