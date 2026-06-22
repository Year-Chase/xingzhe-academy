import { Controller, Get, Post, Patch, Param, Query, Body, ParseIntPipe, BadRequestException } from '@nestjs/common'
import { ActivityService } from './activity.service'
import { ActivityFlowService } from './activity-flow.service'

@Controller('admin')
export class AdminActivityController {
  constructor(
    private readonly activitySvc: ActivityService,
    private readonly flow: ActivityFlowService,
  ) {}

  // ── helpers ──
  private toAdminItem(a: any, registeredCount: number) {
    return {
      id: a.id,
      title: a.title,
      description: a.description || '',
      location: a.location || '',
      city: '',
      startTime: a.startTime,
      endTime: a.endTime,
      capacity: a.capacity,
      registeredCount,
      status: a.status,
      coverImage: a.coverImage || '',
      price: 0,
      memberPrice: 0,
      lifetimeMemberPrice: 0,
      paymentMode: 'FULL',
      createdAt: a.createdAt,
      updatedAt: a.createdAt,
    }
  }

  // GET /admin/activity?page=1&limit=20&status=PUBLISHED&keyword=
  @Get('activity')
  async getList(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status') status: string,
    @Query('keyword') keyword: string,
  ) {
    const p = Math.max(1, parseInt(page) || 1)
    const l = Math.min(100, Math.max(1, parseInt(limit) || 20))
    const { items, total } = await this.activitySvc.adminGetList(p, l, status || undefined, keyword || undefined)
    const enriched = await Promise.all(
      items.map(async (a) => this.toAdminItem(a, await this.flow.getRegisteredCount(a.id))),
    )
    return { items: enriched, total, page: p, limit: l }
  }

  // GET /admin/activity/:id
  @Get('activity/:id')
  async getDetail(@Param('id', ParseIntPipe) id: number) {
    const a = await this.activitySvc.getDetail(id)
    const registeredCount = await this.flow.getRegisteredCount(id)
    return this.toAdminItem(a, registeredCount)
  }

  // POST /admin/activity
  @Post('activity')
  async create(@Body() body: any) {
    if (!body.title || !body.location || !body.startTime || !body.capacity || body.capacity <= 0) {
      throw new BadRequestException('title, location, startTime, and capacity (>0) are required')
    }
    return this.activitySvc.adminCreate(body)
  }

  // PATCH /admin/activity/:id
  @Patch('activity/:id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    if (body.capacity !== undefined && body.capacity <= 0) {
      throw new BadRequestException('capacity must be > 0')
    }
    return this.activitySvc.adminUpdate(id, body)
  }

  // POST /admin/activity/:id/publish
  @Post('activity/:id/publish')
  async publish(@Param('id', ParseIntPipe) id: number) {
    return this.activitySvc.adminPublish(id)
  }

  // POST /admin/activity/:id/close
  @Post('activity/:id/close')
  async close(@Param('id', ParseIntPipe) id: number) {
    return this.activitySvc.adminClose(id)
  }
}
