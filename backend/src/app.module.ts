import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Activity } from './activity/entities/activity.entity'
import { ActivityRegistration } from './activity/entities/activity-registration.entity'
import { ActivityOrder } from './activity/entities/activity-order.entity'
import { ActivityQR } from './activity/entities/activity-qr.entity'
import { ActivityModule } from './activity/activity.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'data/xingzhe.db',
      synchronize: true,
      logging: true,
      entities: [Activity, ActivityRegistration, ActivityOrder, ActivityQR],
    }),
    ActivityModule,
    UsersModule,
  ],
})
export class AppModule {}
