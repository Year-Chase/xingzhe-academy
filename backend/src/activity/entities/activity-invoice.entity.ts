import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

export type InvoiceStatus = 'REQUESTED' | 'ISSUED' | 'CANCELED'
export type InvoiceType = 'PERSONAL' | 'COMPANY'

@Entity('activity_invoice')
export class ActivityInvoice {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  orderId: number

  @Column({ type: 'varchar', length: 100, nullable: true })
  userId: string | null

  @Column({ type: 'int', nullable: true })
  activityId: number | null

  @Column({ type: 'varchar', length: 200 })
  title: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  taxNo: string | null

  @Column({ type: 'varchar', length: 20, nullable: true })
  invoiceType: InvoiceType | null

  @Column({ type: 'varchar', length: 200, nullable: true })
  companyAddress: string | null

  @Column({ type: 'varchar', length: 50, nullable: true })
  companyPhone: string | null

  @Column({ type: 'varchar', length: 120, nullable: true })
  bankName: string | null

  @Column({ type: 'varchar', length: 80, nullable: true })
  bankAccount: string | null

  @Column({ type: 'varchar', length: 120, nullable: true })
  email: string | null

  @Column({ type: 'varchar', length: 300, nullable: true })
  remark: string | null

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number

  @Column({ type: 'varchar', length: 20, default: 'REQUESTED' })
  status: InvoiceStatus

  @CreateDateColumn()
  createdAt: Date

  @Column({ type: 'datetime', nullable: true })
  issuedAt: Date | null
}
