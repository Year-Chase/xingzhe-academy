import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export type RefundProvider = 'WECHAT' | 'OFFLINE' | 'OTHER'
export type RefundTransactionStatus = 'INIT' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'ABNORMAL'

@Entity('refund_transaction')
@Index('idx_refund_transaction_order', ['orderId'])
@Index('idx_refund_transaction_payment', ['paymentTransactionId'])
@Index('idx_refund_transaction_status', ['status'])
export class RefundTransaction {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string

  @Column({ type: 'bigint' })
  orderId: string

  @Column({ type: 'bigint' })
  paymentTransactionId: string

  @Column({ type: 'bigint', nullable: true })
  activityRefundId: string | null

  @Column({ type: 'varchar', length: 30, default: 'WECHAT' })
  refundProvider: RefundProvider

  @Column({ type: 'varchar', length: 64, unique: true })
  merchantRefundNo: string

  @Column({ type: 'varchar', length: 128, nullable: true, unique: true })
  providerRefundNo: string | null

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number

  @Column({ type: 'int' })
  amountCents: number

  @Column({ type: 'varchar', length: 30, default: 'INIT' })
  status: RefundTransactionStatus

  @Column({ type: 'varchar', length: 500, nullable: true })
  reason: string | null

  @Column({ type: 'text', nullable: true })
  failureReason: string | null

  @Column({ type: 'datetime', nullable: true })
  requestedAt: Date | null

  @Column({ type: 'datetime', nullable: true })
  successAt: Date | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
