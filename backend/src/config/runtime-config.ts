const LOGIN_MODES = ['mock', 'real'] as const

export type WechatLoginMode = typeof LOGIN_MODES[number]

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production'
}

export function getWechatLoginMode(): WechatLoginMode {
  const value = process.env.WECHAT_LOGIN_MODE

  if (!value) {
    if (isProductionRuntime()) {
      throw new Error('WECHAT_LOGIN_MODE must be explicitly configured in production')
    }
    return 'mock'
  }

  if (!LOGIN_MODES.includes(value as WechatLoginMode)) {
    throw new Error(`WECHAT_LOGIN_MODE must be one of: ${LOGIN_MODES.join(', ')}`)
  }

  if (isProductionRuntime() && value === 'mock') {
    throw new Error('WECHAT_LOGIN_MODE=mock is not allowed in production')
  }

  return value as WechatLoginMode
}

export function getCorsOrigin(): string | string[] {
  const value = process.env.CORS_ORIGIN

  if (!value) {
    if (isProductionRuntime()) {
      throw new Error('CORS_ORIGIN must be explicitly configured in production')
    }
    return '*'
  }

  if (isProductionRuntime() && value.trim() === '*') {
    throw new Error('CORS_ORIGIN=* is not allowed in production')
  }

  return value === '*' ? '*' : value.split(',').map(s => s.trim()).filter(Boolean)
}
