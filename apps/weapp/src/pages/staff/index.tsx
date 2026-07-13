import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'

import { API_BASE_URL as API } from '../../config/api'
import { userAuthHeader } from '../../utils/user'

const C = {
  bg: '#F7F6F2',
  white: '#FFFFFF',
  green: '#3F6B4F',
  dark: '#18231E',
  body: '#3E463F',
  neutral: '#7A8178',
  border: '#EDE9DF',
  lightGreen: '#EEF5EF',
}

export default function StaffIndexPage() {
  const [checking, setChecking] = useState(true)

  const verifyStaffAccess = async () => {
    setChecking(true)
    try {
      const res = await Taro.request({
        url: `${API}/staff/checkin/activities`,
        header: userAuthHeader(),
      })
      if (res.statusCode === 401 || res.statusCode === 403) {
        Taro.showToast({ title: '无工作人员权限', icon: 'none' })
        setTimeout(() => Taro.switchTab({ url: '/pages/mine/index' }), 500)
      }
    } catch (_e) {
      Taro.showToast({ title: '无法确认工作人员权限', icon: 'none' })
    } finally {
      setChecking(false)
    }
  }

  useDidShow(() => { verifyStaffAccess() })

  return (
    <View style={{ minHeight: '100vh', background: C.bg, padding: '32rpx', boxSizing: 'border-box' }}>
      <View style={{ marginBottom: '28rpx' }}>
        <Text style={{ display: 'block', fontSize: '40rpx', fontWeight: '700', color: C.dark }}>工作人员工具</Text>
        <Text style={{ display: 'block', marginTop: '10rpx', fontSize: '26rpx', color: C.neutral }}>请选择现场需要使用的工具</Text>
      </View>

      <View
        onClick={() => {
          if (!checking) Taro.navigateTo({ url: '/pages/staff/checkin/index' })
        }}
        style={{ background: C.white, borderRadius: '24rpx', border: `1rpx solid ${C.border}`, padding: '32rpx', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <View>
          <Text style={{ display: 'block', fontSize: '32rpx', fontWeight: '700', color: C.dark }}>扫码核销</Text>
          <Text style={{ display: 'block', marginTop: '8rpx', fontSize: '24rpx', color: C.neutral }}>选择活动后扫描用户签到二维码</Text>
        </View>
        <Text style={{ fontSize: '28rpx', color: C.green }}>&gt;</Text>
      </View>
    </View>
  )
}
