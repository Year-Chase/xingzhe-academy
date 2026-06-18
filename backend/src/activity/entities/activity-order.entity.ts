import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm'
import { ActivityRegistration } from './activity-registration.entity'

@Entity('activity_order')
export class ActivityOrder {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number

  @CreateDateColumn()
  createdAt: Date

  @OneToOne(() => ActivityRegistration, (reg) => reg.order)
  @JoinColumn({ name: 'registrationId' })
  registration: ActivityRegistration

  @Column({ unique: true })
  registrationId: number
}
