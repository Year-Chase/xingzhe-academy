import { Module, Global } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { AdminTokenService } from './admin-token.service'
import { AdminAuthController } from './admin-auth.controller'
import { JwtAuthGuard } from './jwt-auth.guard'
import { MiniappJwtService } from './miniapp-jwt.service'
import { MiniappAuthGuard } from './miniapp-auth.guard'
import { User } from '../users/entities/user.entity'
import { AdminUser } from './entities/admin-user.entity'
import { AdminAuthService } from './admin-auth.service'

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User, AdminUser]), JwtModule.register({})],
  controllers: [AdminAuthController],
  providers: [AdminTokenService, AdminAuthService, JwtAuthGuard, MiniappJwtService, MiniappAuthGuard],
  exports: [AdminTokenService, AdminAuthService, JwtAuthGuard, MiniappJwtService, MiniappAuthGuard],
})
export class AuthModule {}
