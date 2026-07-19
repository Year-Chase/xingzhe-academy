import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ActivityController } from './activity.controller'
import { AdminActivityController } from './admin-activity.controller'
import { AdminOrderController } from './admin-order.controller'
import { AdminFinanceController } from './admin-finance.controller'
import { AdminInvoiceController } from './admin-invoice.controller'
import { AdminCrmController } from './admin-crm.controller'
import { StaffCheckinController } from './staff-checkin.controller'
import { ActivityService } from './activity.service'
import { ActivityFlowService } from './activity-flow.service'
import { CheckinStatisticsService } from './checkin-statistics.service'
import { Activity } from './entities/activity.entity'
import { ActivityCategory } from './entities/activity-category.entity'
import { ActivityRegistration } from './entities/activity-registration.entity'
import { ActivityOrder } from './entities/activity-order.entity'
import { ActivityQR } from './entities/activity-qr.entity'
import { ActivityRefund } from './entities/activity-refund.entity'
import { ActivityInvoice } from './entities/activity-invoice.entity'
import { UserTag } from './entities/user-tag.entity'
import { TagDefinition } from './entities/tag-definition.entity'
import { UserTagRelation } from './entities/user-tag-relation.entity'
import { UserNote } from './entities/user-note.entity'
import { UserProfile } from './entities/user-profile.entity'
import { UserInviteRecord } from './entities/user-invite-record.entity'
import { ActivityInviteRecord } from './entities/activity-invite-record.entity'
import { ActivityRegistrationInfo } from './entities/activity-registration-info.entity'
import { User } from '../users/entities/user.entity'
import { UserRegistrationProfile } from '../users/entities/user-registration-profile.entity'
import { AdminDictionaryController } from './admin-dictionary.controller'
import { SystemTagRefreshJob } from './jobs/system-tag-refresh.job'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Activity,
      ActivityCategory,
      ActivityRegistration,
      ActivityOrder,
      ActivityQR,
      ActivityRefund,
      ActivityInvoice,
      UserTag,
      TagDefinition,
      UserTagRelation,
      UserNote,
      UserProfile,
      UserInviteRecord,
      ActivityInviteRecord,
      ActivityRegistrationInfo,
      User,
      UserRegistrationProfile,
    ]),
  ],
  controllers: [
    ActivityController,
    AdminActivityController,
    AdminOrderController,
    AdminFinanceController,
    AdminInvoiceController,
    AdminCrmController,
    AdminDictionaryController,
    StaffCheckinController,
  ],
  providers: [ActivityService, ActivityFlowService, CheckinStatisticsService, SystemTagRefreshJob],
})
export class ActivityModule {}
