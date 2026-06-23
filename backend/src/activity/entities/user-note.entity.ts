import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('user_note')
export class UserNote {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 100 })
  userId: string

  @Column({ type: 'text' })
  note: string

  @CreateDateColumn()
  createdAt: Date
}
