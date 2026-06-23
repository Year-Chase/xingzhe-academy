import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('user_profile')
export class UserProfile {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 100, unique: true })
  userId: string

  @Column({ type: 'varchar', length: 7, nullable: true })
  birthYearMonth: string | null

  @Column({ type: 'datetime', nullable: true })
  registeredAt: Date | null

  @Column({ type: 'datetime', nullable: true })
  lastLoginAt: Date | null

  @CreateDateColumn()
  createdAt: Date
}
