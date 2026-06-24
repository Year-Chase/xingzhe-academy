import { Component, PropsWithChildren } from 'react'
import Taro from '@tarojs/taro'
import './app.css'

const API = 'http://172.20.10.10:3000'

class App extends Component<PropsWithChildren> {
  componentDidMount() {
    this.ensureLogin()
  }

  componentDidShow() {
    // re-check on every show — covers wx.reLaunch cases
    this.ensureLogin()
  }

  componentDidHide() {}

  async ensureLogin() {
    try {
      const existingId = Taro.getStorageSync('xingzhe_user_id')

      if (typeof existingId === 'string' && existingId.startsWith('user_')) {
        console.log('[xingzhe-login] app: cached', existingId.slice(0, 20) + '...')
        return
      }

      // Clear stale non-user_ cache
      if (existingId) {
        console.log('[xingzhe-login] app: clearing stale', existingId)
        Taro.removeStorageSync('xingzhe_user_id')
        Taro.removeStorageSync('xingzhe_user_profile')
      }

      const res = await Taro.request({
        method: 'POST',
        url: `${API}/users/wechat-login`,
        data: { code: 'mock-code', nickname: '', avatarUrl: '', gender: 'unknown' },
        header: { 'content-type': 'application/json' },
      })

      console.log('[xingzhe-login] app: response', res.statusCode)

      if (res.statusCode < 200 || res.statusCode >= 300) {
        console.warn('[xingzhe-login] app: unexpected status', res.statusCode)
        return
      }

      const user = (res.data as any)?.user
      if (user?.id && typeof user.id === 'string' && user.id.startsWith('user_')) {
        Taro.setStorageSync('xingzhe_user_id', user.id)
        Taro.setStorageSync('xingzhe_user_profile', user)
        console.log('[xingzhe-login] app: success', user.id)
      } else {
        console.warn('[xingzhe-login] app: response missing user.id')
      }
    } catch (err) {
      console.warn('[xingzhe-login] app: failed', err)
    }
  }

  render() {
    return this.props.children
  }
}

export default App
