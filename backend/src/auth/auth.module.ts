import { Module, Global } from '@nestjs/common'
import { AdminTokenService } from './admin-token.service'
import { AdminAuthController } from './admin-auth.controller'
import { JwtAuthGuard } from './jwt-auth.guard'

@Global()
@Module({
  controllers: [AdminAuthController],
  providers: [AdminTokenService, JwtAuthGuard],
  exports: [AdminTokenService, JwtAuthGuard],
})
export class AuthModule {}
