import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm'

/** A rendered certificate belongs to one user registration, never to its template. */
@Entity('issued_certificate')
@Index('uq_issued_certificate_user_activity', ['userId', 'activityId'], { unique: true })
@Index('uq_issued_certificate_public_token', ['publicToken'], { unique: true })
export class IssuedCertificate {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string

  @Column({ type: 'varchar', length: 50 })
  userId: string

  @Column({ type: 'int' })
  activityId: number

  @Column({ type: 'varchar', length: 96 })
  publicToken: string

  @Column({ type: 'varchar', length: 500 })
  imageUrl: string

  @Column({ type: 'int', nullable: true })
  templateId: number | null

  @Column({ type: 'text', nullable: true })
  renderSnapshot: string | null

  @Column({ type: 'varchar', length: 500, nullable: true })
  friendShareImageUrl: string | null

  @Column({ type: 'varchar', length: 500, nullable: true })
  timelineShareImageUrl: string | null

  @Column({ type: 'datetime' })
  issuedAt: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
