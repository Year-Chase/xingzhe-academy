import { Injectable } from '@nestjs/common'
import { WechatPayConfigService } from './wechat-pay-config.service'
import { WechatSignService } from './wechat-sign.service'

export interface WechatRequestOptions {
  method: 'GET' | 'POST'
  path: string
  body?: unknown
}

@Injectable()
export class WechatPayClient {
  private readonly baseUrl = 'https://api.mch.weixin.qq.com'

  constructor(
    private readonly configService: WechatPayConfigService,
    private readonly signService: WechatSignService,
  ) {}

  buildSignedRequest(options: WechatRequestOptions) {
    const body = options.body ? JSON.stringify(options.body) : ''
    const authorization = this.signService.buildAuthorizationHeader(options.method, options.path, body)
    return {
      url: `${this.baseUrl}${options.path}`,
      method: options.method,
      body,
      headers: {
        Authorization: authorization,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Wechatpay-Serial': this.configService.getConfig().certSerialNo,
      },
    }
  }

  async jsapiOrder() {
    throw new Error('WECHAT_PAY_CLIENT_NOT_IMPLEMENTED')
  }

  async queryOrder() {
    throw new Error('WECHAT_PAY_CLIENT_NOT_IMPLEMENTED')
  }

  async closeOrder() {
    throw new Error('WECHAT_PAY_CLIENT_NOT_IMPLEMENTED')
  }

  async createRefund() {
    throw new Error('WECHAT_PAY_CLIENT_NOT_IMPLEMENTED')
  }

  async queryRefund() {
    throw new Error('WECHAT_PAY_CLIENT_NOT_IMPLEMENTED')
  }
}
