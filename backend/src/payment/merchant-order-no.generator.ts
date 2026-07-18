import { randomBytes } from 'crypto'
import { Injectable } from '@nestjs/common'
import type { PaymentTradeType } from './entities/payment-transaction.entity'

@Injectable()
export class MerchantOrderNoGenerator {
  payment(tradeType: PaymentTradeType): string {
    return `XZ${this.timestamp()}${this.stageCode(tradeType)}${this.random()}`
  }

  refund(): string {
    return `RF${this.timestamp()}${this.random()}`
  }

  private timestamp(): string {
    const d = new Date()
    const pad = (n: number, len = 2) => String(n).padStart(len, '0')
    return [
      d.getFullYear(),
      pad(d.getMonth() + 1),
      pad(d.getDate()),
      pad(d.getHours()),
      pad(d.getMinutes()),
      pad(d.getSeconds()),
      pad(d.getMilliseconds(), 3),
    ].join('')
  }

  private stageCode(tradeType: PaymentTradeType): string {
    return ({ FULL: 'F', PREPAY: 'P', POSTPAY: 'O' } as const)[tradeType]
  }

  private random(): string {
    return randomBytes(4).toString('hex').toUpperCase()
  }
}
