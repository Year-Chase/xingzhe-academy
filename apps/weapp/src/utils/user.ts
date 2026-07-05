import Taro from '@tarojs/taro'

import { API_BASE_URL as API } from '../config/api'

/**
 * Read login state from Storage.
 */
export function getStoredUserId(): string {
  const id = Taro.getStorageSync('xingzhe_user_id')
  if (typeof id === 'string' && id.startsWith('user_')) return id
  return ''
}

export function getStoredToken(): string {
  return Taro.getStorageSync('xingzhe_auth_token') || ''
}

export function getStoredProfile(): any | null {
  return Taro.getStorageSync('xingzhe_user_profile') || null
}

/**
 * Check if user is fully logged in (both userId and token present).
 */
export function isLoggedIn(): boolean {
  const uid = getStoredUserId()
  const tok = getStoredToken()
  return !!(uid && tok)
}

/**
 * Global logout: clear all login-related storage + navigate to login page.
 */
export function logoutUser() {
  Taro.removeStorageSync('xingzhe_user_id')
  Taro.removeStorageSync('xingzhe_auth_token')
  Taro.removeStorageSync('xingzhe_user_profile')
  Taro.removeStorageSync('xingzhe_reginfo_pending')
  Taro.reLaunch({ url: '/pages/auth/login/index' })
}

/**
 * Login via phone authorization + Taro.login.
 *
 * 1. Calls Taro.login to get loginCode.
 * 2. Sends loginCode + phoneCode (or encryptedData/iv) to backend.
 * 3. On success, stores userId/token/profile in Storage.
 *
 * @returns { userId, token, profile } or null on failure.
 */
export async function loginWithPhone(input: {
  phoneCode?: string
  encryptedData?: string
  iv?: string
}): Promise<{ userId: string; token: string; profile: any } | null> {
  if (!input.phoneCode && !input.encryptedData) {
    console.warn('[xingzhe-login] no phone authorization data')
    return null
  }

  try {
    const loginRes = await Taro.login()
    const code = loginRes.code
    if (!code) {
      console.warn('[xingzhe-login] Taro.login returned empty code')
      return null
    }

    const res = await Taro.request({
      method: 'POST',
      url: `${API}/users/wechat-login`,
      data: {
        code,
        phoneCode: input.phoneCode || '',
        encryptedData: input.encryptedData || '',
        iv: input.iv || '',
        profile: { nickname: '行者', avatarUrl: '' },
      },
      header: { 'content-type': 'application/json' },
    })

    if (res.statusCode < 200 || res.statusCode >= 300) {
      console.warn('[xingzhe-login] unexpected status', res.statusCode)
      return null
    }

    const data = res.data as any
    const userId = data?.userId || data?.user?.id
    if (userId && typeof userId === 'string' && userId.startsWith('user_')) {
      Taro.setStorageSync('xingzhe_user_id', userId)
      if (data.token) Taro.setStorageSync('xingzhe_auth_token', data.token)
      const profile = data?.user || data
      Taro.setStorageSync('xingzhe_user_profile', profile)
      return { userId, token: data.token, profile }
    }

    console.warn('[xingzhe-login] response missing userId')
    return null
  } catch (err) {
    console.error('[auth]', err)
    return null
  }
}

// ── Legacy aliases for backward compatibility ──
export function getUserId(): string { return getStoredUserId() }
export async function doLogin(_showToast = false): Promise<string> {
  // Do NOT auto-login without phone. Return '' so callers block.
  return ''
}
export async function ensureUserId(showToast = true): Promise<string> {
  const cached = getStoredUserId()
  if (cached) return cached
  if (!showToast) return ''
  if (showToast) Taro.showToast({ title: '请先完成登录', icon: 'none' })
  return ''
}
