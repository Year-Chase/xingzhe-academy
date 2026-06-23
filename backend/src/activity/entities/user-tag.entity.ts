import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('user_tag')
export class UserTag {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 100 })
  userId: string

  @Column({ type: 'varchar', length: 50 })
  tag: string

  @CreateDateColumn()
  createdAt: Date
}
