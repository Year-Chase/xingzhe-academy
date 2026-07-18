import { createSign, createVerify, randomBytes } from 'crypto'
import { readFileSync } from 'fs'
import { Injectable } from '@nestjs/common'
import { WechatPayConfigService } from './wechat-pay-config.service'

@Injectable()
export class WechatSignService {
  constructor(private readonly configService: WechatPayConfigService) {}

  timestamp(): string {
    return Math.floor(Date.now() / 1000).toString()
  }

  nonce(): string {
    return randomBytes(16).toString('hex')
  }

  buildRequestMessage(method: string, urlPathWithQuery: string, timestamp: string, nonce: string, body = ''): string {
    return `${method.toUpperCase()}\n${urlPathWithQuery}\n${timestamp}\n${nonce}\n${body}\n`
  }

  signMessage(message: string): string {
    const privateKey = readFileSync(this.configService.getConfig().privateKeyPath, 'utf8')
    return createSign('RSA-SHA256').update(message).sign(privateKey, 'base64')
  }

  verifySignature(publicKeyPem: string, message: string, signature: string): boolean {
    return createVerify('RSA-SHA256').update(message).verify(publicKeyPem, signature, 'base64')
  }

  buildAuthorizationHeader(method: string, urlPathWithQuery: string, body = ''): string {
    const config = this.configService.getConfig()
    const timestamp = this.timestamp()
    const nonce = this.nonce()
    const message = this.buildRequestMessage(method, urlPathWithQuery, timestamp, nonce, body)
    const signature = this.signMessage(message)
    return [
      'WECHATPAY2-SHA256-RSA2048',
      `mchid="${config.mchId}"`,
      `nonce_str="${nonce}"`,
      `timestamp="${timestamp}"`,
      `serial_no="${config.certSerialNo}"`,
      `signature="${signature}"`,
    ].join(',')
  }

  buildNotifyMessage(timestamp: string, nonce: string, body: string): string {
    return `${timestamp}\n${nonce}\n${body}\n`
  }
}
