import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm'

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN'
export type AdminStatus = 'ACTIVE' | 'DISABLED'

@Entity('admin_user')
@Index('uq_admin_user_username', ['username'], { unique: true })
export class AdminUser {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string

  @Column({ type: 'varchar', length: 80 })
  username: string

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string

  @Column({ type: 'varchar', length: 20, default: 'ADMIN' })
  role: AdminRole

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: AdminStatus

  @Column({ type: 'boolean', default: false })
  mustChangePassword: boolean

  @Column({ type: 'boolean', default: false })
  isSystemAccount: boolean

  @Column({ type: 'datetime', nullable: true })
  lastLoginAt: Date | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
