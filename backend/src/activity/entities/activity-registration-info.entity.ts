import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm'

@Entity('activity_registration_info')
export class ActivityRegistrationInfo {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string

  @Column({ type: 'int' })
  activityId: number

  @Column({ type: 'int', nullable: true })
  registrationId: number

  @Column({ type: 'varchar', length: 100 })
  userId: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  realName: string | null

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null

  @Column({ type: 'varchar', length: 50, nullable: true })
  idCardNo: string | null

  @Column({ type: 'varchar', length: 50, nullable: true })
  departureCity: string | null

  @Column({ type: 'varchar', length: 50, nullable: true })
  transportPreference: string | null

  @Column({ type: 'varchar', length: 100, nullable: true })
  roomPreference: string | null

  @Column({ type: 'datetime', nullable: true })
  confirmedAt: Date | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
