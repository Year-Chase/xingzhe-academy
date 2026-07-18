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
export class MockPaymentProvider implements PaymentProvider {
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    return { prepayId: `mock_${input.merchantOrderNo}`, raw: { paymentProvider: 'MOCK', status: 'PREPAY_CREATED' } }
  }

  async queryPayment(merchantOrderNo: string): Promise<QueryPaymentResult> {
    return { status: 'MOCK_PENDING', raw: { paymentProvider: 'MOCK', merchantOrderNo } }
  }

  async closePayment(_merchantOrderNo: string): Promise<void> {}

  async createRefund(input: CreateRefundInput): Promise<CreateRefundResult> {
    return { providerRefundNo: null, raw: { paymentProvider: 'MOCK', merchantRefundNo: input.merchantRefundNo, status: 'PROCESSING' } }
  }

  async queryRefund(merchantRefundNo: string): Promise<QueryRefundResult> {
    return { status: 'MOCK_PENDING', raw: { paymentProvider: 'MOCK', merchantRefundNo } }
  }

  async verifyNotify(_headers: Record<string, string | string[] | undefined>, _body: Buffer | string): Promise<unknown> {
    return { paymentProvider: 'MOCK', verified: false }
  }
}
