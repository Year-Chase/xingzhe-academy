import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export type UserInvoiceType = 'PERSONAL' | 'COMPANY'

@Entity('user_invoice_profile')
export class UserInvoiceProfile {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 100, unique: true })
  userId: string

  @Column({ type: 'varchar', length: 20, default: 'PERSONAL' })
  invoiceType: UserInvoiceType

  @Column({ type: 'varchar', length: 200 })
  invoiceTitle: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  taxNumber: string | null

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

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
