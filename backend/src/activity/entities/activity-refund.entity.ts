import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

export type RefundStatus = 'SUCCESS' | 'FAILED'

@Entity('activity_refund')
export class ActivityRefund {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  orderId: number

  @Column({ type: 'varchar', length: 100, nullable: true })
  userId: string | null

  @Column({ type: 'int', nullable: true })
  activityId: number | null

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number

  @Column({ type: 'varchar', length: 500, nullable: true })
  reason: string | null

  @Column({ type: 'varchar', length: 20, default: 'SUCCESS' })
  status: RefundStatus

  @CreateDateColumn()
  createdAt: Date
}
