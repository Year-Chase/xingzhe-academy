import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToOne, OneToMany, JoinColumn } from 'typeorm'
import { Activity } from './activity.entity'
import { ActivityOrder } from './activity-order.entity'
import { ActivityQR } from './activity-qr.entity'

export type RegistrationStatus = 'REGISTERED' | 'PAID' | 'CHECKED_IN' | 'EXPIRED'
export type CheckinSource = 'MINIAPP_STAFF' | 'ADMIN' | null

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

  @Column({ type: 'datetime', nullable: true })
  checkedInAt: Date | null

  @Column({ type: 'varchar', length: 50, nullable: true })
  checkedInByUserId: string | null

  @Column({ type: 'varchar', length: 30, nullable: true })
  checkinSource: CheckinSource

  @ManyToOne(() => Activity, (activity) => activity.registrations, { eager: true })
  @JoinColumn({ name: 'activityId' })
  activity: Activity

  @OneToOne(() => ActivityOrder, (order) => order.registration)
  order: ActivityOrder

  @OneToMany(() => ActivityQR, (qr) => qr.registration)
  qrs: ActivityQR[]
}
