import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ActivityController } from './activity.controller'
import { ActivityService } from './activity.service'
import { ActivityFlowService } from './activity-flow.service'
import { Activity } from './entities/activity.entity'
import { ActivityRegistration } from './entities/activity-registration.entity'
import { ActivityOrder } from './entities/activity-order.entity'
import { ActivityQR } from './entities/activity-qr.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Activity,
      ActivityRegistration,
      ActivityOrder,
      ActivityQR,
    ]),
  ],
  controllers: [ActivityController],
  providers: [ActivityService, ActivityFlowService],
})
export class ActivityModule {}
