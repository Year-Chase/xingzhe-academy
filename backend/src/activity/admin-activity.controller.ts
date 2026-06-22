import { Controller, Get, Post, Patch, Param, Query, Body, ParseIntPipe, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname, join } from 'path'
import { mkdirSync, existsSync } from 'fs'
import { ActivityService } from './activity.service'
import { ActivityFlowService } from './activity-flow.service'

type UploadedActivityImageFile = {
  originalname: string
  filename: string
  mimetype: string
  size: number
  buffer?: Buffer
  path?: string
}

@Controller('admin')
export class AdminActivityController {
  constructor(
    private readonly activitySvc: ActivityService,
    private readonly flow: ActivityFlowService,
  ) {}

  private toAdminItem(a: any, registeredCount: number) {
    const now = new Date()
    const effStatus = this.activitySvc.effectiveStatus(a)
    return {
      id: a.id,
      title: a.title,
      slogan: a.slogan || '',
      description: a.description || '',
      location: a.location || '',
      city: a.city || '',
      startTime: a.startTime,
      endTime: a.endTime,
      registrationStartTime: a.registrationStartTime || null,
      registrationEndTime: a.registrationEndTime || null,
      capacity: a.capacity,
      registeredCount,
      status: effStatus,
      coverImage: a.coverImage || '',
      price: a.price ?? 0,
      memberPrice: a.memberPrice ?? 0,
      lifetimeMemberPrice: a.lifetimeMemberPrice ?? 0,
      paymentMode: a.paymentMode || 'FULL',
      createdAt: a.createdAt,
      updatedAt: a.createdAt,
    }
  }

  // GET /admin/activity?page=1&limit=20&status=&keyword=
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
    if (!body.title || !body.location || !body.startTime || !body.endTime || !body.registrationStartTime || !body.registrationEndTime || !body.capacity || body.capacity <= 0) {
      throw new BadRequestException('title, location, startTime, endTime, registrationStartTime, registrationEndTime, and capacity (>0) are required')
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

  // POST /admin/activity/upload-cover
  @Post('activity/upload-cover')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        const dir = join(__dirname, '..', '..', 'uploads', 'activity')
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
        cb(null, dir)
      },
      filename: (_req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
        cb(null, unique + extname(file.originalname))
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
        cb(new BadRequestException('Only jpg/jpeg/png/webp allowed'), false)
      } else {
        cb(null, true)
      }
    },
  }))
  uploadCover(@UploadedFile() file: UploadedActivityImageFile)  {
    if (!file) throw new BadRequestException('No file uploaded')
    return { url: '/uploads/activity/' + file.filename }
  }
}
