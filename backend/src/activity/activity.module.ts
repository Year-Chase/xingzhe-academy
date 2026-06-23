import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ActivityController } from './activity.controller'
import { AdminActivityController } from './admin-activity.controller'
import { AdminOrderController } from './admin-order.controller'
import { AdminFinanceController } from './admin-finance.controller'
import { AdminInvoiceController } from './admin-invoice.controller'
import { ActivityService } from './activity.service'
import { ActivityFlowService } from './activity-flow.service'
import { Activity } from './entities/activity.entity'
import { ActivityRegistration } from './entities/activity-registration.entity'
import { ActivityOrder } from './entities/activity-order.entity'
import { ActivityQR } from './entities/activity-qr.entity'
import { ActivityRefund } from './entities/activity-refund.entity'
import { ActivityInvoice } from './entities/activity-invoice.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Activity,
      ActivityRegistration,
      ActivityOrder,
      ActivityQR,
      ActivityRefund,
      ActivityInvoice,
    ]),
  ],
  controllers: [
    ActivityController,
    AdminActivityController,
    AdminOrderController,
    AdminFinanceController,
    AdminInvoiceController,
  ],
  providers: [ActivityService, ActivityFlowService],
})
export class ActivityModule {}
