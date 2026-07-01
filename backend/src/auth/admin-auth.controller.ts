import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common'
import { AdminTokenService } from './admin-token.service'

/**
 * V2.7.1 Admin authentication controller.
 *
 * POST /admin/auth/login
 * Body: { username, password }
 * Success: { token: "<signed HMAC token>" }
 * Failure: 401
 *
 * Credentials are read from server-side .env:
 *   ADMIN_USERNAME
 *   ADMIN_PASSWORD
 * These MUST NOT be committed to source control.
 */
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly tokenService: AdminTokenService) {}

  @Post('login')
  login(@Body('username') username: string, @Body('password') password: string) {
    if (!username || !password) {
      throw new UnauthorizedException('请输入账号和密码')
    }

    const validUser = process.env.ADMIN_USERNAME
    const validPass = process.env.ADMIN_PASSWORD

    if (!validUser || !validPass) {
      throw new UnauthorizedException('服务端未配置管理员凭证')
    }

    if (username !== validUser || password !== validPass) {
      throw new UnauthorizedException('账号或密码错误')
    }

    const token = this.tokenService.issueToken(username)
    return { token }
  }
}
