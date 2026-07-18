import { Inject, Injectable } from '@nestjs/common'
import type { PaymentProvider } from './payment-provider.interface'
import { PAYMENT_PROVIDER } from './payment.tokens'

@Injectable()
export class PaymentService {
  constructor(@Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider) {}

  yuanToCents(amount: number | string | null | undefined): number {
    const value = Number(amount || 0)
    if (!Number.isFinite(value)) return 0
    return Math.round(value * 100)
  }

  getProvider(): PaymentProvider {
    return this.provider
  }
}
