import { createDecipheriv } from 'crypto'
import { Injectable } from '@nestjs/common'
import { WechatPayConfigService } from './wechat-pay-config.service'
import { WechatSignService } from './wechat-sign.service'

export interface WechatEncryptedResource {
  algorithm: string
  ciphertext: string
  nonce: string
  associated_data?: string
}

@Injectable()
export class WechatNotifyService {
  constructor(
    private readonly configService: WechatPayConfigService,
    private readonly signService: WechatSignService,
  ) {}

  verifySignature(publicKeyPem: string, headers: Record<string, string | string[] | undefined>, body: string): boolean {
    const timestamp = this.header(headers, 'wechatpay-timestamp')
    const nonce = this.header(headers, 'wechatpay-nonce')
    const signature = this.header(headers, 'wechatpay-signature')
    if (!timestamp || !nonce || !signature) return false
    return this.signService.verifySignature(publicKeyPem, this.signService.buildNotifyMessage(timestamp, nonce, body), signature)
  }

  decryptResource(resource: WechatEncryptedResource): string {
    if (resource.algorithm !== 'AEAD_AES_256_GCM') {
      throw new Error(`Unsupported WeChat notify algorithm: ${resource.algorithm}`)
    }
    const key = Buffer.from(this.configService.getConfig().apiV3Key, 'utf8')
    const ciphertext = Buffer.from(resource.ciphertext, 'base64')
    const authTag = ciphertext.subarray(ciphertext.length - 16)
    const encrypted = ciphertext.subarray(0, ciphertext.length - 16)
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(resource.nonce, 'utf8'))
    if (resource.associated_data) decipher.setAAD(Buffer.from(resource.associated_data, 'utf8'))
    decipher.setAuthTag(authTag)
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
  }

  private header(headers: Record<string, string | string[] | undefined>, key: string): string {
    const value = headers[key] || headers[key.toLowerCase()] || headers[this.titleCase(key)]
    return Array.isArray(value) ? value[0] || '' : value || ''
  }

  private titleCase(key: string): string {
    return key.split('-').map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`).join('-')
  }
}
