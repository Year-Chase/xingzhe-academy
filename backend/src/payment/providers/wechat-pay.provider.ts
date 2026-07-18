import { Injectable } from '@nestjs/common'
import {
  CreatePaymentInput,
  CreatePaymentResult,
  CreateRefundInput,
  CreateRefundResult,
  PaymentProvider,
  QueryPaymentResult,
  QueryRefundResult,
} from '../payment-provider.interface'
import { WechatPayClient } from '../wechat/wechat-pay.client'

@Injectable()
export class WechatPayProvider implements PaymentProvider {
  constructor(private readonly client: WechatPayClient) {}

  async createPayment(_input: CreatePaymentInput): Promise<CreatePaymentResult> {
    await this.client.jsapiOrder()
    throw new Error('WECHAT_PAY_PROVIDER_NOT_IMPLEMENTED')
  }

  async queryPayment(_merchantOrderNo: string): Promise<QueryPaymentResult> {
    await this.client.queryOrder()
    throw new Error('WECHAT_PAY_PROVIDER_NOT_IMPLEMENTED')
  }

  async closePayment(_merchantOrderNo: string): Promise<void> {
    await this.client.closeOrder()
  }

  async createRefund(_input: CreateRefundInput): Promise<CreateRefundResult> {
    await this.client.createRefund()
    throw new Error('WECHAT_PAY_PROVIDER_NOT_IMPLEMENTED')
  }

  async queryRefund(_merchantRefundNo: string): Promise<QueryRefundResult> {
    await this.client.queryRefund()
    throw new Error('WECHAT_PAY_PROVIDER_NOT_IMPLEMENTED')
  }

  async verifyNotify(_headers: Record<string, string | string[] | undefined>, _body: Buffer | string): Promise<unknown> {
    throw new Error('WECHAT_PAY_PROVIDER_NOT_IMPLEMENTED')
  }
}
