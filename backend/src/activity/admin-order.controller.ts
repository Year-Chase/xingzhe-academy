import { Controller, Get, Post, Param, Query, Body, ParseIntPipe, BadRequestException, UseGuards } from '@nestjs/common'
import { ActivityFlowService } from './activity-flow.service'
import { ActivityService } from './activity.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminOrderController {
  constructor(
    private readonly flow: ActivityFlowService,
    private readonly activitySvc: ActivityService,
  ) {}

  @Get('orders')
  async getList(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('activityId') activityId: string,
    @Query('userId') userId: string,
    @Query('status') status: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const p = Math.max(1, parseInt(page) || 1)
    const l = Math.min(100, Math.max(1, parseInt(limit) || 20))
    const { items, total } = await this.flow.getOrders(p, l, {
      activityId: activityId ? parseInt(activityId) : undefined,
      userId: userId || undefined,
      status: status || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
    return { items, total, page: p, limit: l }
  }

  @Get('orders/:id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    const { items } = await this.flow.getOrders(1, 1, {})
    const order = items.find((o) => o.id === id)
    if (!order) throw new BadRequestException('Order not found')
    return order
  }

  @Post('orders/:id/refund')
  async refund(@Param('id', ParseIntPipe) id: number, @Body() body: { amount: number; reason?: string }) {
    if (!body.amount || body.amount <= 0) throw new BadRequestException('amount must be > 0')
    return this.flow.refund(id, body.amount, body.reason || '')
  }
}
