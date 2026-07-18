import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PaymentTransaction } from './entities/payment-transaction.entity'
import { RefundTransaction } from './entities/refund-transaction.entity'
import { MerchantOrderNoGenerator } from './merchant-order-no.generator'
import { PaymentService } from './payment.service'
import { PAYMENT_PROVIDER } from './payment.tokens'
import { MockPaymentProvider } from './providers/mock-payment.provider'
import { OfflinePaymentProvider } from './providers/offline-payment.provider'
import { WechatPayProvider } from './providers/wechat-pay.provider'
import { WechatNotifyService } from './wechat/wechat-notify.service'
import { WechatPayClient } from './wechat/wechat-pay.client'
import { WechatPayConfigService } from './wechat/wechat-pay-config.service'
import { WechatSignService } from './wechat/wechat-sign.service'

@Module({
  imports: [TypeOrmModule.forFeature([PaymentTransaction, RefundTransaction])],
  providers: [
    WechatPayConfigService,
    WechatSignService,
    WechatNotifyService,
    WechatPayClient,
    WechatPayProvider,
    MockPaymentProvider,
    OfflinePaymentProvider,
    MerchantOrderNoGenerator,
    {
      provide: PAYMENT_PROVIDER,
      useFactory: (
        wechat: WechatPayProvider,
        mock: MockPaymentProvider,
        offline: OfflinePaymentProvider,
      ) => {
        const provider = (process.env.PAYMENT_PROVIDER || 'MOCK').trim().toUpperCase()
        if (provider === 'WECHAT') return wechat
        if (provider === 'OFFLINE') return offline
        return mock
      },
      inject: [WechatPayProvider, MockPaymentProvider, OfflinePaymentProvider],
    },
    PaymentService,
  ],
  exports: [PaymentService, MerchantOrderNoGenerator, TypeOrmModule],
})
export class PaymentModule {}
