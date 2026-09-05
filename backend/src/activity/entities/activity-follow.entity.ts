import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('activity_follow')
@Index('uniq_activity_follow_user_activity', ['userId', 'activityId'], { unique: true })
@Index('idx_activity_follow_activity_current', ['activityId', 'unfollowedAt'])
export class ActivityFollow {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 100 })
  userId: string

  @Column({ type: 'int' })
  activityId: number

  @Column({ type: 'datetime' })
  followedAt: Date

  @Column({ type: 'datetime', nullable: true })
  unfollowedAt: Date | null

  @Column({ type: 'datetime', nullable: true })
  convertedAt: Date | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
