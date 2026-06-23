import { Controller, Get, Post, Patch, Param, Query, Body, ParseIntPipe, BadRequestException } from '@nestjs/common'
import { ActivityFlowService } from './activity-flow.service'

@Controller('admin/invoices')
export class AdminInvoiceController {
  constructor(private readonly flow: ActivityFlowService) {}

  @Get()
  async getList(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status') status: string,
    @Query('activityId') activityId: string,
    @Query('userId') userId: string,
  ) {
    const p = Math.max(1, parseInt(page) || 1)
    const l = Math.min(100, Math.max(1, parseInt(limit) || 20))
    const { items, total } = await this.flow.getInvoices(p, l, {
      status: status || undefined,
      activityId: activityId ? parseInt(activityId) : undefined,
      userId: userId || undefined,
    })
    return { items, total, page: p, limit: l }
  }

  @Post('request')
  async request(@Body() body: { orderId: number; title: string; taxNo?: string }) {
    if (!body.orderId || !body.title) throw new BadRequestException('orderId and title are required')
    return this.flow.requestInvoice(body.orderId, body.title, body.taxNo)
  }

  @Patch(':id/issue')
  async issue(@Param('id', ParseIntPipe) id: number) {
    return this.flow.issueInvoice(id)
  }
}
