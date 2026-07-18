import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Activity } from './activity.entity'

export type ActivityCategoryStatus = 'ACTIVE' | 'INACTIVE'

@Entity('activity_category')
export class ActivityCategory {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string

  @Column({ type: 'varchar', length: 80 })
  name: string

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ type: 'int', default: 0 })
  sortOrder: number

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: ActivityCategoryStatus

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => Activity, (activity) => activity.category)
  activities: Activity[]
}
