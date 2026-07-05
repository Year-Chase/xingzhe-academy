import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm'
import { ActivityRegistration } from './activity-registration.entity'

export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIAL_REFUND'
export type PayType = 'FULL' | 'PREPAY'

@Entity('activity_order')
export class ActivityOrder {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 100, nullable: true })
  userId: string | null

  @Column({ type: 'int', nullable: true })
  activityId: number | null

  @Column({ unique: true })
  registrationId: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundedAmount: number

  @Column({ type: 'int', default: 0 })
  refundCount: number

  @Column({ type: 'varchar', length: 30, default: 'PENDING' })
  status: OrderStatus

  @Column({ type: 'varchar', length: 20, default: 'FULL' })
  payType: PayType

  @CreateDateColumn()
  createdAt: Date

  @Column({ type: 'datetime', nullable: true })
  paidAt: Date

  @Column({ type: 'datetime', nullable: true })
  refundedAt: Date

  // ── V2.8-C: Pricing snapshot at order time ──
  @Column({ type: 'varchar', length: 50, nullable: true })
  userTypeAtOrder: string | null

  @Column({ type: 'varchar', length: 50, nullable: true })
  priceSource: string | null  // "pricingRules" or "legacy"

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fullAmount: number | null  // total price for this user type

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  orderPrepayAmount: number | null  // prepay portion for PREPAY mode

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  orderPostpayAmount: number | null  // postpay portion for PREPAY mode

  @Column({ type: 'text', nullable: true })
  pricingSnapshot: string | null  // JSON of matched pricing rule

  // ── V2.8-D: Postpay management ──
  @Column({ type: 'varchar', length: 30, default: 'NONE' })
  postpayStatus: string  // 'NONE' | 'UNPAID' | 'PAID' | 'OVERDUE' | 'WAIVED'

  @Column({ type: 'datetime', nullable: true })
  postpayPaidAt: Date | null

  @Column({ type: 'int', default: 0 })
  postpayReminderCount: number

  @Column({ type: 'datetime', nullable: true })
  lastPostpayReminderAt: Date | null

  @Column({ type: 'datetime', nullable: true })
  postpayWaivedAt: Date | null

  @Column({ type: 'text', nullable: true })
  postpayWaiveReason: string | null

  @OneToOne(() => ActivityRegistration, (reg) => reg.order)
  @JoinColumn({ name: 'registrationId' })
  registration: ActivityRegistration
}
