import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common'
import { ActivityFlowService } from './activity-flow.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('admin/finance')
@UseGuards(JwtAuthGuard)
export class AdminFinanceController {
  constructor(private readonly flow: ActivityFlowService) {}

  @Get('summary')
  getSummary() {
    return this.flow.financeSummary()
  }

  @Get('activity/:id')
  getActivityFinance(@Param('id', ParseIntPipe) id: number) {
    return this.flow.financeActivity(id)
  }
}
