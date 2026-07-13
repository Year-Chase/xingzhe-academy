import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common'
import { ActivityFlowService } from './activity-flow.service'

@Controller('staff/checkin')
export class StaffCheckinController {
  constructor(private readonly flow: ActivityFlowService) {}

  @Get('activities')
  getActivities(
    @Headers('x-user-id') headerUserId: string,
    @Headers('authorization') authorization: string,
  ) {
    const userId = this.resolveAuthenticatedUserId(headerUserId, authorization)
    return this.flow.getStaffCheckinActivities(userId)
  }

  @Post('scan')
  scan(
    @Headers('x-user-id') headerUserId: string,
    @Headers('authorization') authorization: string,
    @Body() body: { activityId?: number; stage?: string; code?: string },
  ) {
    const userId = this.resolveAuthenticatedUserId(headerUserId, authorization)
    return this.flow.staffScanCheckin(userId, body)
  }

  private resolveAuthenticatedUserId(headerUserId?: string, authorization?: string): string {
    const token = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : ''
    const userId = (headerUserId || '').trim()
    if (!token || !userId) throw new UnauthorizedException('请先完成登录')
    if (!userId.startsWith('user_')) throw new UnauthorizedException('请先完成登录')
    if (!token.startsWith('xztok_') || !token.endsWith(`_${userId.slice(0, 12)}`)) throw new UnauthorizedException('请先完成登录')
    return userId
  }
}
