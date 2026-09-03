import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import type { PaymentProvider } from './payment-provider.interface'
import { PAYMENT_PROVIDER } from './payment.tokens'
import { yuanToCentsStrict } from './money'

@Injectable()
export class PaymentService {
  constructor(@Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider) {}

  yuanToCents(amount: number | string | null | undefined): number {
    try {
      return yuanToCentsStrict(amount)
    } catch {
      throw new BadRequestException('Invalid payment amount')
    }
  }

  getProvider(): PaymentProvider {
    return this.provider
  }
}
