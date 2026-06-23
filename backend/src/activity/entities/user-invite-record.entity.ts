import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('user_invite_record')
export class UserInviteRecord {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 100 })
  inviterUserId: string

  @Column({ type: 'varchar', length: 100 })
  inviteeUserId: string

  @CreateDateColumn()
  createdAt: Date
}
