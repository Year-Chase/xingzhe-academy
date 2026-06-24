import { View, Text } from '@tarojs/components'

export default function TrailPage() {
  return (
    <View style={{
      minHeight: '100vh', background: '#F7F6F2',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32rpx',
    }}>
      <Text style={{ fontSize: '60rpx', display: 'block', marginBottom: '24rpx' }}>🗺️</Text>
      <Text style={{ fontSize: '34rpx', fontWeight: '700', color: '#18231E', display: 'block', marginBottom: '12rpx' }}>行者之路</Text>
      <Text style={{ fontSize: '28rpx', color: '#8A9288', display: 'block' }}>即将开放</Text>
    </View>
  )
}
