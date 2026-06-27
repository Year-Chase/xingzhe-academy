import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('certificate_template')
export class CertificateTemplate {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 100 })
  name: string

  @Column({ type: 'varchar', length: 300, nullable: true })
  description: string

  @Column({ type: 'varchar', length: 500 })
  imageUrl: string

  @Column({ type: 'boolean', default: false })
  isDefault: boolean

  @Column({ type: 'boolean', default: true })
  enabled: boolean

  @Column({ type: 'text', nullable: true })
  fieldConfig: string // JSON string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
