import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { User } from './entities/user.entity'
import { Activity } from '../activity/entities/activity.entity'
import { ActivityRegistration } from '../activity/entities/activity-registration.entity'
import { ActivityRegistrationInfo } from '../activity/entities/activity-registration-info.entity'
import { CertificateTemplate } from '../certificate/entities/certificate-template.entity'

@Module({
  imports: [TypeOrmModule.forFeature([User, Activity, ActivityRegistration, ActivityRegistrationInfo, CertificateTemplate])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [TypeOrmModule],
})
export class UsersModule {}
