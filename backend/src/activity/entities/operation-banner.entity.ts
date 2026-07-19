import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export type OperationBannerStatus = 'ACTIVE' | 'INACTIVE'
export type OperationBannerJumpType = 'NONE' | 'ACTIVITY' | 'CATEGORY' | 'SERIES'

@Entity('operation_banner')
export class OperationBanner {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 500 })
  imageUrl: string

  @Column({ type: 'varchar', length: 100 })
  title: string

  @Column({ type: 'varchar', length: 240, nullable: true })
  description: string | null

  @Column({ type: 'int', default: 0 })
  sortOrder: number

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: OperationBannerStatus

  @Column({ type: 'datetime', nullable: true })
  startAt: Date | null

  @Column({ type: 'datetime', nullable: true })
  endAt: Date | null

  @Column({ type: 'varchar', length: 20, default: 'NONE' })
  jumpType: OperationBannerJumpType

  @Column({ type: 'varchar', length: 120, nullable: true })
  jumpValue: string | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
