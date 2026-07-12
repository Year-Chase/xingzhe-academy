import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('user_registration_profile')
export class UserRegistrationProfile {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 50, unique: true })
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

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
