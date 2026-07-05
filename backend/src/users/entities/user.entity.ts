import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm'

@Entity('user')
export class User {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string

  @Column({ type: 'varchar', length: 200, nullable: true, unique: true })
  openid: string | null

  @Column({ type: 'varchar', length: 200, nullable: true })
  unionid: string | null

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null

  @Column({ type: 'varchar', length: 100, nullable: true })
  nickname: string | null

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender: string | null

  @Column({ type: 'varchar', length: 10, nullable: true })
  birthday: string | null

  @Column({ type: 'varchar', length: 7, nullable: true })
  birthYearMonth: string | null

  @Column({ type: 'varchar', length: 50, nullable: true })
  identityType: string | null

  @Column({ type: 'varchar', length: 200, nullable: true })
  intro: string | null

  @Column({ type: 'boolean', default: false })
  isMember: boolean

  @Column({ type: 'boolean', default: false })
  isLifetimeMember: boolean

  @Column({ type: 'datetime', default: () => "datetime('now')" })
  registeredAt: Date

  @Column({ type: 'datetime', nullable: true })
  lastLoginAt: Date | null

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
