import Taro from '@tarojs/taro'

import { API_BASE_URL as API } from '../config/api'

const LOGIN_REDIRECT_KEY = 'xingzhe_login_redirect_state'
const LOGIN_RETURN_ACTION_KEY = 'xingzhe_login_return_action'
const USER_PROFILE_STORAGE_KEY = 'xingzhe_user_profile'
const LOGIN_REDIRECT_TTL = 10 * 60 * 1000
const TAB_BAR_PAGES = new Set(['/pages/index/index', '/pages/trail/index', '/pages/mine/index'])

export type LoginRedirectAction = 'REGISTER' | 'OPEN_ORDER' | 'OPEN_REGISTRATION' | 'OPEN_INVOICE'

export type LoginRedirectState = {
  returnUrl: string
  action?: LoginRedirectAction
  activityId?: number | string
  orderId?: number | string
  timestamp?: number
  preferBack?: boolean
}

/**
 * Read login state from Storage.
 */
export function getStoredUserId(): string {
  const id = Taro.getStorageSync('xingzhe_user_id')
  if (typeof id === 'string' && id.startsWith('user_')) return id
  return ''
}

export function getStoredToken(): string {
  const token = Taro.getStorageSync('xingzhe_auth_token') || ''
  if (typeof token === 'string' && token.startsWith('xztok_')) {
    clearStoredLoginState()
    return ''
  }
  return token
}

export function getStoredProfile(): any | null {
  return cleanStoredProfileCache()
}

export function sanitizeUserProfileForStorage(profile: any): any | null {
  if (!profile || typeof profile !== 'object') return null
  const safe: Record<string, any> = {}
  const allowedKeys = [
    'id',
    'nickname',
    'avatarUrl',
    'identityType',
    'isMember',
    'isLifetimeMember',
    'phoneMasked',
    'gender',
    'intro',
  ]
  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(profile, key)) safe[key] = profile[key]
  }
  return safe
}

export function saveStoredProfile(profile: any): any | null {
  const safe = sanitizeUserProfileForStorage(profile)
  if (safe) Taro.setStorageSync(USER_PROFILE_STORAGE_KEY, safe)
  else Taro.removeStorageSync(USER_PROFILE_STORAGE_KEY)
  return safe
}

export function cleanStoredProfileCache(): any | null {
  const raw = Taro.getStorageSync(USER_PROFILE_STORAGE_KEY)
  if (!raw || typeof raw !== 'object') return raw || null
  const safe = sanitizeUserProfileForStorage(raw)
  const changed =
    Object.keys(raw).some(key => !Object.prototype.hasOwnProperty.call(safe || {}, key)) ||
    Object.keys(safe || {}).some(key => raw[key] !== (safe as any)[key])
  if (changed) {
    if (safe) Taro.setStorageSync(USER_PROFILE_STORAGE_KEY, safe)
    else Taro.removeStorageSync(USER_PROFILE_STORAGE_KEY)
  }
  return safe
}

/**
 * Check if user is fully logged in (both userId and token present).
 */
export function isLoggedIn(): boolean {
  const uid = getStoredUserId()
  const tok = getStoredToken()
  return !!(uid && tok)
}

export function clearStoredLoginState() {
  Taro.removeStorageSync('xingzhe_user_id')
  Taro.removeStorageSync('xingzhe_auth_token')
  Taro.removeStorageSync(USER_PROFILE_STORAGE_KEY)
  Taro.removeStorageSync('xingzhe_reginfo_pending')
  Taro.removeStorageSync(LOGIN_REDIRECT_KEY)
  Taro.removeStorageSync(LOGIN_RETURN_ACTION_KEY)
}

/**
 * Global logout: clear all login-related storage + navigate to login page.
 */
export function logoutUser() {
  clearStoredLoginState()
  Taro.reLaunch({ url: '/pages/auth/login/index' })
}

function safeInternalUrl(url: string): string {
  const value = (url || '').trim()
  if (!value.startsWith('/pages/')) return ''
  if (value.includes('://') || value.startsWith('//')) return ''
  return value
}

export function saveLoginRedirectState(state: LoginRedirectState) {
  const returnUrl = safeInternalUrl(state.returnUrl)
  if (!returnUrl) return
  Taro.setStorageSync(LOGIN_REDIRECT_KEY, {
    ...state,
    returnUrl,
    timestamp: Date.now(),
  })
}

export function consumeLoginRedirectState(): LoginRedirectState | null {
  const raw = Taro.getStorageSync(LOGIN_REDIRECT_KEY)
  Taro.removeStorageSync(LOGIN_REDIRECT_KEY)
  if (!raw || typeof raw !== 'object') return null
  const state = raw as LoginRedirectState
  if (!safeInternalUrl(state.returnUrl)) return null
  if (!state.timestamp || Date.now() - state.timestamp > LOGIN_REDIRECT_TTL) return null
  return state
}

function splitUrl(url: string): { path: string; full: string } {
  const safe = safeInternalUrl(url) || '/pages/index/index'
  const path = safe.split('?')[0]
  return { path, full: safe }
}

function queryValue(url: string, key: string): string {
  const query = url.split('?')[1] || ''
  const params = query.split('&').filter(Boolean)
  for (const param of params) {
    const [k, v = ''] = param.split('=')
    if (decodeURIComponent(k) === key) return decodeURIComponent(v)
  }
  return ''
}

function findPageDelta(targetUrl: string): number {
  const pages = Taro.getCurrentPages?.() || []
  const { path } = splitUrl(targetUrl)
  const route = path.replace(/^\//, '')
  const targetId = queryValue(targetUrl, 'id') || queryValue(targetUrl, 'activityId')
  for (let i = pages.length - 2; i >= 0; i--) {
    const page = pages[i] as any
    if (page?.route !== route) continue
    if (targetId) {
      const options = page?.options || {}
      const pageId = String(options.id || options.activityId || '')
      if (pageId && pageId !== targetId) continue
    }
    return pages.length - 1 - i
  }
  return 0
}

function saveLoginReturnAction(state: LoginRedirectState) {
  if (!state.action) return
  Taro.setStorageSync(LOGIN_RETURN_ACTION_KEY, { ...state, timestamp: Date.now() })
}

export function consumeLoginReturnAction(): LoginRedirectState | null {
  const raw = Taro.getStorageSync(LOGIN_RETURN_ACTION_KEY)
  Taro.removeStorageSync(LOGIN_RETURN_ACTION_KEY)
  if (!raw || typeof raw !== 'object') return null
  const state = raw as LoginRedirectState
  if (!state.timestamp || Date.now() - state.timestamp > LOGIN_REDIRECT_TTL) return null
  return state
}

export async function redirectAfterLogin(fallback = '/pages/index/index') {
  const state = consumeLoginRedirectState()
  const target = state?.returnUrl || fallback
  const { path, full } = splitUrl(target)
  const delta = state?.preferBack ? findPageDelta(full) : 0
  if (delta > 0 && state) {
    saveLoginReturnAction(state)
    return Taro.navigateBack({ delta })
  }
  if (TAB_BAR_PAGES.has(path)) {
    return Taro.switchTab({ url: path })
  }
  try {
    return await Taro.redirectTo({ url: full })
  } catch (e) {
    return Taro.reLaunch({ url: full })
  }
}

export async function navigateToLoginWithRedirect(state: LoginRedirectState) {
  saveLoginRedirectState(state)
  try {
    return await Taro.navigateTo({ url: '/pages/auth/login/index' })
  } catch (e) {
    return Taro.reLaunch({ url: '/pages/auth/login/index' })
  }
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
}): Promise<{ userId: string; token: string; profile: any; isNewUser: boolean } | null> {
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
      saveStoredProfile(profile)
      return { userId, token: data.token, profile, isNewUser: !!data.isNewUser }
    }

    console.warn('[xingzhe-login] response missing userId')
    return null
  } catch (_err) {
    console.error('[auth] login failed')
    return null
  }
}

export function userAuthHeader(): Record<string, string> {
  const token = getStoredToken()
  return {
    Authorization: token ? `Bearer ${token}` : '',
  }
}

export async function updateUserProfile(body: Record<string, any>) {
  const uid = getStoredUserId()
  if (!uid) throw new Error('请先完成登录')
  const res = await Taro.request({
    method: 'PATCH',
    url: `${API}/users/me/profile`,
    data: body,
    header: { 'content-type': 'application/json', ...userAuthHeader() },
  })
  if (res.statusCode < 200 || res.statusCode >= 300) {
    throw new Error((res.data as any)?.message || '保存失败')
  }
  const profile = res.data as any
  saveStoredProfile(profile)
  return profile
}

export async function getRegistrationProfile(): Promise<Record<string, string>> {
  const uid = getStoredUserId()
  if (!uid) throw new Error('请先完成登录')
  const res = await Taro.request({
    url: `${API}/users/me/registration-profile`,
    header: userAuthHeader(),
  })
  if (res.statusCode < 200 || res.statusCode >= 300) {
    throw new Error((res.data as any)?.message || '读取报名资料失败')
  }
  const data = (res.data || {}) as Record<string, any>
  return {
    realName: data.realName || '',
    phone: data.phone || '',
    idCardNo: data.idCardNo || '',
    departureCity: data.departureCity || '',
    transportPreference: data.transportPreference || '',
    roomPreference: data.roomPreference || '',
  }
}

export async function uploadUserAvatar(filePath: string): Promise<string> {
  const uid = getStoredUserId()
  if (!uid) throw new Error('请先完成登录')
  const res = await Taro.uploadFile({
    url: `${API}/users/me/avatar`,
    filePath,
    name: 'file',
    header: userAuthHeader(),
  })
  if (res.statusCode < 200 || res.statusCode >= 300) {
    throw new Error('头像上传失败')
  }
  const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
  if (!data?.url) throw new Error('头像上传失败')
  return data.url
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
