import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Activity } from './activity/entities/activity.entity'
import { ActivityRegistration } from './activity/entities/activity-registration.entity'
import { ActivityOrder } from './activity/entities/activity-order.entity'
import { ActivityQR } from './activity/entities/activity-qr.entity'
import { ActivityRefund } from './activity/entities/activity-refund.entity'
import { ActivityInvoice } from './activity/entities/activity-invoice.entity'
import { UserTag } from './activity/entities/user-tag.entity'
import { UserNote } from './activity/entities/user-note.entity'
import { UserProfile } from './activity/entities/user-profile.entity'
import { UserInviteRecord } from './activity/entities/user-invite-record.entity'
import { ActivityInviteRecord } from './activity/entities/activity-invite-record.entity'
import { User } from './users/entities/user.entity'
import { ActivityModule } from './activity/activity.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'data/xingzhe.db',
      synchronize: true,
      logging: false,
      entities: [Activity, ActivityRegistration, ActivityOrder, ActivityQR, ActivityRefund, ActivityInvoice, UserTag, UserNote, UserProfile, UserInviteRecord, ActivityInviteRecord, User],
    }),
    ActivityModule,
    UsersModule,
  ],
})
export class AppModule {}
