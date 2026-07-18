import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { loadEnv } from './config/env'

// Ensure .env is loaded before ANY process.env reads below
loadEnv()

import { Activity } from './activity/entities/activity.entity'
import { ActivityCategory } from './activity/entities/activity-category.entity'
import { ActivityRegistration } from './activity/entities/activity-registration.entity'
import { ActivityOrder } from './activity/entities/activity-order.entity'
import { ActivityQR } from './activity/entities/activity-qr.entity'
import { ActivityRefund } from './activity/entities/activity-refund.entity'
import { ActivityInvoice } from './activity/entities/activity-invoice.entity'
import { UserTag } from './activity/entities/user-tag.entity'
import { TagDefinition } from './activity/entities/tag-definition.entity'
import { UserTagRelation } from './activity/entities/user-tag-relation.entity'
import { UserNote } from './activity/entities/user-note.entity'
import { UserProfile } from './activity/entities/user-profile.entity'
import { UserInviteRecord } from './activity/entities/user-invite-record.entity'
import { ActivityInviteRecord } from './activity/entities/activity-invite-record.entity'
import { ActivityRegistrationInfo } from './activity/entities/activity-registration-info.entity'
import { User } from './users/entities/user.entity'
import { UserInvoiceProfile } from './users/entities/user-invoice-profile.entity'
import { UserRegistrationProfile } from './users/entities/user-registration-profile.entity'
import { CertificateTemplate } from './certificate/entities/certificate-template.entity'
import { ActivityModule } from './activity/activity.module'
import { UsersModule } from './users/users.module'
import { CertificateModule } from './certificate/certificate.module'
import { AuthModule } from './auth/auth.module'
import { PaymentModule } from './payment/payment.module'
import { PaymentTransaction } from './payment/entities/payment-transaction.entity'
import { RefundTransaction } from './payment/entities/refund-transaction.entity'

const entities = [Activity, ActivityCategory, ActivityRegistration, ActivityOrder, ActivityQR, ActivityRefund, ActivityInvoice, UserTag, TagDefinition, UserTagRelation, UserNote, UserProfile, UserInviteRecord, ActivityInviteRecord, ActivityRegistrationInfo, CertificateTemplate, User, UserInvoiceProfile, UserRegistrationProfile, PaymentTransaction, RefundTransaction]

// Production uses MySQL from env vars; development uses local SQLite
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.DB_HOST
// DB_SYNCHRONIZE allows temporary table creation on first deployment (default false for safety)
const dbSync = process.env.DB_SYNCHRONIZE === 'true'
const dbConfig: any = isProduction
  ? {
      type: 'mysql',
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME || 'xingzhe',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'xingzhe',
      synchronize: dbSync,
      logging: false,
      charset: 'utf8mb4',
    }
  : {
      type: 'better-sqlite3',
      database: 'data/xingzhe.db',
      synchronize: true,
      logging: false,
    }

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...dbConfig, entities }),
    ActivityModule,
    UsersModule,
    CertificateModule,
    AuthModule,
    PaymentModule,
  ],
})
export class AppModule {}
