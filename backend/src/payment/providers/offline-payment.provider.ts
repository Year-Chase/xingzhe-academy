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

@Injectable()
export class OfflinePaymentProvider implements PaymentProvider {
  async createPayment(_input: CreatePaymentInput): Promise<CreatePaymentResult> {
    throw new Error('OFFLINE_PAYMENT_PROVIDER_NOT_IMPLEMENTED')
  }

  async queryPayment(_merchantOrderNo: string): Promise<QueryPaymentResult> {
    throw new Error('OFFLINE_PAYMENT_PROVIDER_NOT_IMPLEMENTED')
  }

  async closePayment(_merchantOrderNo: string): Promise<void> {}

  async createRefund(_input: CreateRefundInput): Promise<CreateRefundResult> {
    throw new Error('OFFLINE_PAYMENT_PROVIDER_NOT_IMPLEMENTED')
  }

  async queryRefund(_merchantRefundNo: string): Promise<QueryRefundResult> {
    throw new Error('OFFLINE_PAYMENT_PROVIDER_NOT_IMPLEMENTED')
  }

  async verifyNotify(_headers: Record<string, string | string[] | undefined>, _body: Buffer | string): Promise<unknown> {
    throw new Error('OFFLINE_PAYMENT_PROVIDER_NOT_IMPLEMENTED')
  }
}
