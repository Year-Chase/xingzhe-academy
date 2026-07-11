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
    @Query('keyword') keyword: string,
    @Query('activityTitle') activityTitle: string,
    @Query('status') status: string,
    @Query('paymentMode') paymentMode: string,
    @Query('postpayStatus') postpayStatus: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('createdFrom') createdFrom: string,
    @Query('createdTo') createdTo: string,
  ) {
    const p = Math.max(1, parseInt(page) || 1)
    const l = Math.min(100, Math.max(1, parseInt(limit) || 20))
    const end = createdTo || endDate || undefined
    const { items, total } = await this.flow.getOrders(p, l, {
      activityId: activityId ? parseInt(activityId) : undefined,
      userId: userId || undefined,
      keyword: keyword || undefined,
      activityTitle: activityTitle || undefined,
      status: status || undefined,
      paymentMode: paymentMode || undefined,
      postpayStatus: postpayStatus || undefined,
      startDate: createdFrom || startDate || undefined,
      endDate: end && /^\d{4}-\d{2}-\d{2}$/.test(end) ? `${end} 23:59:59` : end,
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

  // ── V2.8-D: Postpay management endpoints ──

  @Get('activities/:activityId/postpay-summary')
  async getPostpaySummary(@Param('activityId', ParseIntPipe) activityId: number) {
    return this.flow.getPostpaySummary(activityId)
  }

  @Get('activities/:activityId/postpay-orders')
  async getPostpayOrders(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Query('status') status: string,
    @Query('keyword') keyword: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.flow.getPostpayOrders(activityId, {
      status: status || undefined,
      keyword: keyword || undefined,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
    })
  }

  @Post('orders/:id/mark-postpay-paid')
  async markPostpayPaid(@Param('id', ParseIntPipe) id: number) {
    return this.flow.adminMarkPostpayPaid(id)
  }

  @Post('orders/:id/waive-postpay')
  async waivePostpay(@Param('id', ParseIntPipe) id: number, @Body() body: { reason: string }) {
    if (!body.reason) throw new BadRequestException('免除原因不能为空')
    return this.flow.adminWaivePostpay(id, body.reason)
  }

  @Post('orders/:id/postpay-reminder')
  async sendPostpayReminder(@Param('id', ParseIntPipe) id: number) {
    return this.flow.adminSendPostpayReminder(id)
  }

  @Post('activities/:activityId/postpay-reminders')
  async batchSendPostpayReminders(@Param('activityId', ParseIntPipe) activityId: number) {
    return this.flow.adminBatchSendPostpayReminders(activityId)
  }
}
