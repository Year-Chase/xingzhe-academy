import { Body, Controller, ForbiddenException, Get, Post, Put, Req, UnauthorizedException, UseGuards } from '@nestjs/common'
import { AdminTokenService } from './admin-token.service'
import { AdminAuthService } from './admin-auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'

/**
 * V2.7.1 Admin authentication controller.
 *
 * POST /admin/auth/login
 * Body: { username, password }
 * Success: { token: "<signed HMAC token>" }
 * Failure: 401
 *
 * Credentials are stored only in the admin_user table as scrypt hashes.
 */
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly tokenService: AdminTokenService, private readonly adminAuth: AdminAuthService) {}

  @Post('login')
  async login(@Body('username') username: string, @Body('password') password: string) {
    if (!username || !password) throw new UnauthorizedException('请输入账号和密码')
    const admin = await this.adminAuth.authenticate(username, password)
    return this.authResponse(admin)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() request: any) {
    const admin = await this.adminAuth.getActiveAdmin(request.admin.adminId)
    return this.profile(admin)
  }

  @Post('password/initial')
  @UseGuards(JwtAuthGuard)
  async changeInitialPassword(@Req() request: any, @Body('newPassword') newPassword: string, @Body('confirmPassword') confirmPassword: string) {
    const admin = await this.adminAuth.getActiveAdmin(request.admin.adminId)
    return this.authResponse(await this.adminAuth.changeInitialPassword(admin, newPassword, confirmPassword))
  }

  @Put('password')
  @UseGuards(JwtAuthGuard)
  async changeOwnPassword(@Req() request: any, @Body('currentPassword') currentPassword: string, @Body('newPassword') newPassword: string, @Body('confirmPassword') confirmPassword: string) {
    const admin = await this.adminAuth.getActiveAdmin(request.admin.adminId)
    if (admin.mustChangePassword) throw new ForbiddenException('请先完成首次密码修改')
    return this.authResponse(await this.adminAuth.changeOwnPassword(admin, currentPassword, newPassword, confirmPassword))
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  async listVisibleAdmins() {
    return { items: await this.adminAuth.listVisibleAdmins() }
  }

  private authResponse(admin: any) {
    return { token: this.tokenService.issueToken(admin), admin: this.profile(admin) }
  }

  private profile(admin: any) {
    return { id: admin.id, username: admin.username, role: admin.role, mustChangePassword: admin.mustChangePassword }
  }
}
