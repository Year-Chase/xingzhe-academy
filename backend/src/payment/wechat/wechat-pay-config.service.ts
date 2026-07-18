import { existsSync } from 'fs'
import { Injectable } from '@nestjs/common'

export interface WechatPayConfig {
  enabled: boolean
  appId: string
  mchId: string
  certSerialNo: string
  privateKeyPath: string
  apiV3Key: string
  notifyUrl: string
  refundNotifyUrl: string
}

@Injectable()
export class WechatPayConfigService {
  private readonly config: WechatPayConfig

  constructor() {
    const enabled = this.bool(process.env.WECHAT_PAY_ENABLED)
    this.config = {
      enabled,
      appId: this.value('WECHAT_PAY_APP_ID'),
      mchId: this.value('WECHAT_PAY_MCH_ID'),
      certSerialNo: this.value('WECHAT_PAY_CERT_SERIAL_NO'),
      privateKeyPath: this.value('WECHAT_PAY_PRIVATE_KEY_PATH'),
      apiV3Key: this.value('WECHAT_PAY_API_V3_KEY'),
      notifyUrl: this.value('WECHAT_PAY_NOTIFY_URL'),
      refundNotifyUrl: this.value('WECHAT_PAY_REFUND_NOTIFY_URL'),
    }
    if (enabled) this.validateEnabledConfig()
  }

  getConfig(): WechatPayConfig {
    return this.config
  }

  private value(key: string): string {
    return (process.env[key] || '').trim()
  }

  private bool(value: string | undefined): boolean {
    return value === 'true' || value === '1'
  }

  private validateEnabledConfig() {
    const required: Array<[keyof WechatPayConfig, string]> = [
      ['appId', 'WECHAT_PAY_APP_ID'],
      ['mchId', 'WECHAT_PAY_MCH_ID'],
      ['certSerialNo', 'WECHAT_PAY_CERT_SERIAL_NO'],
      ['privateKeyPath', 'WECHAT_PAY_PRIVATE_KEY_PATH'],
      ['apiV3Key', 'WECHAT_PAY_API_V3_KEY'],
      ['notifyUrl', 'WECHAT_PAY_NOTIFY_URL'],
      ['refundNotifyUrl', 'WECHAT_PAY_REFUND_NOTIFY_URL'],
    ]
    const missing = required
      .filter(([field]) => !String(this.config[field] || '').trim())
      .map(([, envKey]) => envKey)
    if (missing.length > 0) {
      throw new Error(`Wechat Pay config missing: ${missing.join(', ')}`)
    }
    if (!existsSync(this.config.privateKeyPath)) {
      throw new Error('Wechat Pay config invalid: WECHAT_PAY_PRIVATE_KEY_PATH does not exist')
    }
    if (this.config.apiV3Key.length !== 32) {
      throw new Error('Wechat Pay config invalid: WECHAT_PAY_API_V3_KEY must be 32 characters')
    }
  }
}
