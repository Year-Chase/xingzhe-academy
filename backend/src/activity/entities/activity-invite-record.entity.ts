import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('activity_invite_record')
export class ActivityInviteRecord {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'int' })
  activityId: number

  @Column({ type: 'varchar', length: 100 })
  inviterUserId: string

  @Column({ type: 'varchar', length: 100 })
  inviteeUserId: string

  @Column({ type: 'int', nullable: true })
  registrationId: number | null

  @CreateDateColumn()
  createdAt: Date
}
