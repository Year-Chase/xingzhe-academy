import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common'
import { ActivityFlowService } from './activity-flow.service'

@Controller('admin/finance')
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
