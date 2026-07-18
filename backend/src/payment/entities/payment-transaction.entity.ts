import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export type PaymentTradeType = 'FULL' | 'PREPAY' | 'POSTPAY'
export type PaymentProvider = 'WECHAT' | 'OFFLINE' | 'OTHER'
export type PaymentTransactionStatus = 'INIT' | 'PREPAY_CREATED' | 'PAYING' | 'SUCCESS' | 'FAILED' | 'CLOSED'

@Entity('payment_transaction')
@Index('idx_payment_transaction_order', ['orderId'])
@Index('idx_payment_transaction_user', ['userId'])
@Index('idx_payment_transaction_activity', ['activityId'])
@Index('idx_payment_transaction_status', ['status'])
@Index('idx_payment_transaction_trade_type', ['tradeType'])
export class PaymentTransaction {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string

  @Column({ type: 'bigint' })
  orderId: string

  @Column({ type: 'bigint' })
  registrationId: string

  @Column({ type: 'varchar', length: 100 })
  userId: string

  @Column({ type: 'bigint' })
  activityId: string

  @Column({ type: 'varchar', length: 20 })
  tradeType: PaymentTradeType

  @Column({ type: 'varchar', length: 30, default: 'WECHAT' })
  paymentProvider: PaymentProvider

  @Column({ type: 'varchar', length: 64, unique: true })
  merchantOrderNo: string

  @Column({ type: 'varchar', length: 128, nullable: true, unique: true })
  providerTransactionNo: string | null

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number

  @Column({ type: 'int' })
  amountCents: number

  @Column({ type: 'varchar', length: 30, default: 'INIT' })
  status: PaymentTransactionStatus

  @Column({ type: 'varchar', length: 128, nullable: true })
  prepayId: string | null

  @Column({ type: 'datetime', nullable: true })
  paidAt: Date | null

  @Column({ type: 'datetime', nullable: true })
  notifyAt: Date | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
