import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { ActivityFlowService } from './activity-flow.service'
import { MiniappAuthGuard, MiniappRequestUser } from '../auth/miniapp-auth.guard'
import { CurrentMiniappUser } from '../auth/current-miniapp-user.decorator'

@Controller('staff/checkin')
@UseGuards(MiniappAuthGuard)
export class StaffCheckinController {
  constructor(private readonly flow: ActivityFlowService) {}

  @Get('activities')
  getActivities(
    @CurrentMiniappUser() user: MiniappRequestUser,
  ) {
    return this.flow.getStaffCheckinActivities(user.userId)
  }

  @Post('scan')
  scan(
    @CurrentMiniappUser() user: MiniappRequestUser,
    @Body() body: { activityId?: number; stage?: string; code?: string },
  ) {
    return this.flow.staffScanCheckin(user.userId, body)
  }
}
