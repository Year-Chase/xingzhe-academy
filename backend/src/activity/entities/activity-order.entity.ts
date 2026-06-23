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

  @OneToOne(() => ActivityRegistration, (reg) => reg.order)
  @JoinColumn({ name: 'registrationId' })
  registration: ActivityRegistration
}
