import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm'
import { ActivityRegistration } from './activity-registration.entity'

@Entity('activity')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 200 })
  title: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  slogan: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  province: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ type: 'varchar', length: 300, nullable: true })
  location: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string

  @Column({ type: 'datetime', nullable: true })
  startTime: Date

  @Column({ type: 'datetime', nullable: true })
  endTime: Date

  @Column({ type: 'datetime', nullable: true })
  registrationStartTime: Date

  @Column({ type: 'datetime', nullable: true })
  registrationEndTime: Date

  @Column({ type: 'int', default: 0 })
  capacity: number

  @Column({ type: 'varchar', length: 500, nullable: true })
  coverImage: string

  @Column({ type: 'int', default: 0 })
  price: number

  @Column({ type: 'int', default: 0 })
  memberPrice: number

  @Column({ type: 'int', default: 0 })
  lifetimeMemberPrice: number

  @Column({ type: 'varchar', length: 20, default: 'FULL' })
  paymentMode: string

  @Column({ type: 'int', default: 0 })
  prepayAmount: number

  @Column({ type: 'int', default: 0 })
  remainingAmount: number

  @Column({ type: 'datetime', nullable: true })
  remainingPayDate: Date | null

  @Column({ type: 'varchar', length: 50, default: 'DRAFT' })
  status: string

  // ── V2.5A: Registration info collection ──
  @Column({ type: 'text', nullable: true })
  requiredUserInfoFields: string | null  // JSON array, e.g. '["realName","phone"]'

  // ── V2.5A: Group QR ──
  @Column({ type: 'varchar', length: 30, default: 'NONE' })
  groupQrType: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  groupQrImageUrl: string | null

  @Column({ type: 'varchar', length: 100, default: '加入活动群' })
  groupQrTitle: string

  @Column({ type: 'varchar', length: 200, default: '活动通知、集合安排和现场事项将在群内同步' })
  groupQrDescription: string

  // ── V2.5A: Memory ──
  @Column({ type: 'text', nullable: true })
  memoryImages: string | null  // JSON string

  @Column({ type: 'text', nullable: true })
  memoryText: string | null

  // ── V2.6C: Certificate template ──
  @Column({ type: 'int', nullable: true })
  certificateTemplateId: number | null

  // ── V2.6D: Structured location ──
  @Column({ type: 'varchar', length: 50, nullable: true })
  provinceName: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  provinceCode: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  cityName: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  cityCode: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  adcode: string

  @Column({ type: 'float', nullable: true })
  lng: number

  @Column({ type: 'float', nullable: true })
  lat: number

  // ── V2.6E-MVP: Manual location coordinates ──
  @Column({ type: 'varchar', length: 200, nullable: true })
  locationName: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  locationAddress: string

  @Column({ type: 'float', nullable: true })
  locationLat: number

  @Column({ type: 'float', nullable: true })
  locationLng: number

  @Column({ type: 'varchar', length: 20, default: 'gcj02' })
  coordinateType: string

  @Column({ type: 'varchar', length: 20, default: 'manual' })
  locationProvider: string

  @CreateDateColumn()
  createdAt: Date

  @OneToMany(() => ActivityRegistration, (reg) => reg.activity)
  registrations: ActivityRegistration[]
}
