import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToOne, JoinColumn } from 'typeorm'
import { Activity } from './activity.entity'
import { ActivityOrder } from './activity-order.entity'
import { ActivityQR } from './activity-qr.entity'

export type RegistrationStatus = 'REGISTERED' | 'PAID' | 'CHECKED_IN' | 'EXPIRED'

@Entity('activity_registration')
export class ActivityRegistration {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 100 })
  userId: string

  @Column()
  activityId: number

  @Column({ type: 'varchar', length: 50, default: 'REGISTERED' })
  status: RegistrationStatus

  @CreateDateColumn()
  createdAt: Date

  @ManyToOne(() => Activity, (activity) => activity.registrations, { eager: true })
  @JoinColumn({ name: 'activityId' })
  activity: Activity

  @OneToOne(() => ActivityOrder, (order) => order.registration)
  order: ActivityOrder

  @OneToOne(() => ActivityQR, (qr) => qr.registration)
  qr: ActivityQR
}
