import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { User } from './entities/user.entity'
import { Activity } from '../activity/entities/activity.entity'
import { ActivityRegistration } from '../activity/entities/activity-registration.entity'
import { ActivityRegistrationInfo } from '../activity/entities/activity-registration-info.entity'
import { CertificateTemplate } from '../certificate/entities/certificate-template.entity'
import { ActivityOrder } from '../activity/entities/activity-order.entity'
import { ActivityInvoice } from '../activity/entities/activity-invoice.entity'
import { ActivityRefund } from '../activity/entities/activity-refund.entity'
import { UserInvoiceProfile } from './entities/user-invoice-profile.entity'
import { ContentSecurityService } from '../common/content-security.service'

@Module({
  imports: [TypeOrmModule.forFeature([User, Activity, ActivityRegistration, ActivityRegistrationInfo, CertificateTemplate, ActivityOrder, ActivityInvoice, ActivityRefund, UserInvoiceProfile])],
  controllers: [UsersController],
  providers: [UsersService, ContentSecurityService],
  exports: [TypeOrmModule],
})
export class UsersModule {}
