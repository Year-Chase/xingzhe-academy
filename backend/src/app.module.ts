import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Activity } from './activity/entities/activity.entity'
import { ActivityRegistration } from './activity/entities/activity-registration.entity'
import { ActivityOrder } from './activity/entities/activity-order.entity'
import { ActivityQR } from './activity/entities/activity-qr.entity'
import { ActivityRefund } from './activity/entities/activity-refund.entity'
import { ActivityInvoice } from './activity/entities/activity-invoice.entity'
import { ActivityModule } from './activity/activity.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'data/xingzhe.db',
      synchronize: true,
      logging: false,
      entities: [Activity, ActivityRegistration, ActivityOrder, ActivityQR, ActivityRefund, ActivityInvoice],
    }),
    ActivityModule,
    UsersModule,
  ],
})
export class AppModule {}
