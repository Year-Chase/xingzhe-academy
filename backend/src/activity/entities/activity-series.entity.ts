import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Activity } from './activity.entity'

export type ActivitySeriesStatus = 'ACTIVE' | 'INACTIVE'

@Entity('activity_series')
export class ActivitySeries {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 80 })
  name: string

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  coverImage: string | null

  @Column({ type: 'varchar', length: 50, nullable: true })
  shortDescription: string | null

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ type: 'varchar', length: 500, nullable: true })
  externalUrl: string | null

  @Column({ type: 'int', default: 0 })
  sortOrder: number

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: ActivitySeriesStatus

  @Column({ type: 'boolean', default: true })
  showActivities: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => Activity, (activity) => activity.series)
  activities: Activity[]
}
