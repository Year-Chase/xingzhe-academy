import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm'
import { ActivityRegistration } from './activity-registration.entity'

export type QRStatus = 'ACTIVE' | 'USED' | 'EXPIRED'

@Entity('activity_qr')
export class ActivityQR {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 64, unique: true })
  code: string

  @Column({ type: 'varchar', length: 50, default: 'ACTIVE' })
  status: QRStatus

  @Column({ type: 'datetime', nullable: true })
  expiresAt: Date

  @CreateDateColumn()
  createdAt: Date

  @OneToOne(() => ActivityRegistration, (reg) => reg.qr)
  @JoinColumn({ name: 'registrationId' })
  registration: ActivityRegistration

  @Column({ unique: true })
  registrationId: number
}
