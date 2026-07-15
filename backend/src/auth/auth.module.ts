import { Module, Global } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdminTokenService } from './admin-token.service'
import { AdminAuthController } from './admin-auth.controller'
import { JwtAuthGuard } from './jwt-auth.guard'
import { MiniappJwtService } from './miniapp-jwt.service'
import { MiniappAuthGuard } from './miniapp-auth.guard'
import { User } from '../users/entities/user.entity'

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AdminAuthController],
  providers: [AdminTokenService, JwtAuthGuard, MiniappJwtService, MiniappAuthGuard],
  exports: [AdminTokenService, JwtAuthGuard, MiniappJwtService, MiniappAuthGuard],
})
export class AuthModule {}
