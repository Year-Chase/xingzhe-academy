import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm'
import { ActivityRegistration } from './activity-registration.entity'

@Entity('activity')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 200 })
  title: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ type: 'varchar', length: 300, nullable: true })
  location: string

  @Column({ type: 'datetime', nullable: true })
  startTime: Date

  @Column({ type: 'datetime', nullable: true })
  endTime: Date

  @Column({ type: 'int', default: 0 })
  capacity: number

  @Column({ type: 'varchar', length: 500, nullable: true })
  coverImage: string

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string

  @CreateDateColumn()
  createdAt: Date

  @OneToMany(() => ActivityRegistration, (reg) => reg.activity)
  registrations: ActivityRegistration[]
}
