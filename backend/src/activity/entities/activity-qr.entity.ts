import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { ActivityRegistration } from './activity-registration.entity'

export type QRStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'SUPERSEDED' | 'REVOKED'
export type QRStage = 'LEGACY' | 'FULL' | 'PREPAY' | 'POSTPAY'

@Entity('activity_qr')
@Index('idx_activity_qr_registration_id', ['registrationId'])
@Index('idx_activity_qr_registration_status', ['registrationId', 'status'])
@Index('uniq_activity_qr_registration_version', ['registrationId', 'version'], { unique: true })
export class ActivityQR {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 64, unique: true })
  code: string

  @Column({ type: 'varchar', length: 50, default: 'ACTIVE' })
  status: QRStatus

  @Column({ type: 'varchar', length: 20, default: 'LEGACY' })
  stage: QRStage

  @Column({ type: 'int', default: 1 })
  version: number

  @Column({ type: 'datetime', nullable: true })
  expiresAt: Date

  @Column({ type: 'datetime', nullable: true })
  supersededAt: Date | null

  @Column({ type: 'datetime', nullable: true })
  revokedAt: Date | null

  @CreateDateColumn()
  createdAt: Date

  @ManyToOne(() => ActivityRegistration, (reg) => reg.qrs)
  @JoinColumn({ name: 'registrationId' })
  registration: ActivityRegistration

  @Column()
  registrationId: number
}
