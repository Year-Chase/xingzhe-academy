import Taro from '@tarojs/taro'

const API = 'http://172.20.10.10:3000'

/**
 * Get the current real userId from cache.
 * Returns '' if not logged in or cached value is not user_* format.
 */
export function getUserId(): string {
  const id = Taro.getStorageSync('xingzhe_user_id')
  if (typeof id === 'string' && id.startsWith('user_')) return id
  return ''
}

/**
 * Perform login and return userId, or '' on failure.
 * Stores user.id as string, user profile as raw object.
 */
async function doLogin(): Promise<string> {
  console.log('[xingzhe-login] start')
  try {
    const res = await Taro.request({
      method: 'POST',
      url: `${API}/users/wechat-login`,
      data: { code: 'mock-code', nickname: '', avatarUrl: '', gender: 'unknown' },
      header: { 'content-type': 'application/json' },
    })
    console.log('[xingzhe-login] response', res.statusCode, JSON.stringify(res.data).slice(0, 200))

    // Accept any 2xx
    if (res.statusCode < 200 || res.statusCode >= 300) {
      console.warn('[xingzhe-login] unexpected status', res.statusCode)
      return ''
    }

    const user = (res.data as any)?.user
    if (user?.id && typeof user.id === 'string' && user.id.startsWith('user_')) {
      Taro.setStorageSync('xingzhe_user_id', user.id)
      // Store as raw object, not JSON string — so reads don't need JSON.parse
      Taro.setStorageSync('xingzhe_user_profile', user)
      console.log('[xingzhe-login] success', user.id)
      return user.id
    }

    console.warn('[xingzhe-login] response missing user.id', res.data)
    return ''
  } catch (err) {
    console.warn('[xingzhe-login] failed', err)
    return ''
  }
}

/**
 * Ensure a valid userId exists, performing login if needed.
 * Returns userId string, or '' if login failed.
 * @param showToast - whether to show toast on failure
 */
export async function ensureUserId(showToast = true): Promise<string> {
  const cached = getUserId()
  if (cached) return cached

  const uid = await doLogin()
  if (uid) return uid

  if (showToast) Taro.showToast({ title: '请先完成登录', icon: 'none' })
  return ''
}
