import { Controller, Get, Post, Patch, Param, Query, Body, ParseIntPipe, BadRequestException, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { diskStorage } from 'multer'
import { extname } from 'path'
import { ensureUploadSubDir, toPublicUploadUrl } from '../config/upload-path'
import { ActivityService } from './activity.service'
import { ActivityFlowService } from './activity-flow.service'
import { ActivityRegistrationInfo } from './entities/activity-registration-info.entity'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

type UploadedActivityImageFile = {
  originalname: string
  filename: string
  mimetype: string
  size: number
  buffer?: Buffer
  path?: string
}

function maskIdCardNo(value: string | null): string | null {
  if (!value) return null
  return value.slice(0, 3) + '***********' + value.slice(-4)
}

function safeParseJsonArray(str: string | null): string[] {
  if (!str) return []
  try { const v = JSON.parse(str); return Array.isArray(v) ? v : [] } catch { return [] }
}

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminActivityController {
  constructor(
    private readonly activitySvc: ActivityService,
    private readonly flow: ActivityFlowService,
    @InjectRepository(ActivityRegistrationInfo)
    private readonly regInfoRepo: Repository<ActivityRegistrationInfo>,
  ) {}

  private toAdminItem(a: any, registeredCount: number) {
    const now = new Date()
    const effStatus = this.activitySvc.effectiveStatus(a)
    return {
      id: a.id,
      title: a.title,
      slogan: a.slogan || '',
      province: a.province || '',
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
      prepayAmount: a.prepayAmount ?? 0,
      remainingAmount: a.remainingAmount ?? 0,
      remainingPayDate: a.remainingPayDate || null,
      memoryImages: a.memoryImages || null,
      memoryText: a.memoryText || null,
      requiredUserInfoFields: safeParseJsonArray(a.requiredUserInfoFields),
      groupQrType: a.groupQrType || 'NONE',
      groupQrImageUrl: a.groupQrImageUrl || null,
      groupQrTitle: a.groupQrTitle || '加入活动群',
      groupQrDescription: a.groupQrDescription || '活动通知、集合安排和现场事项将在群内同步',
      certificateTemplateId: a.certificateTemplateId || null,
      imageUrls: safeParseJsonArray(a.imageUrls),
      contentBlocks: safeParseJsonArray(a.contentBlocks),
      provinceName: a.provinceName || '',
      provinceCode: a.provinceCode || '',
      cityName: a.cityName || '',
      cityCode: a.cityCode || '',
      adcode: a.adcode || '',
      lng: a.lng ?? null,
      lat: a.lat ?? null,
      locationName: a.locationName || '',
      locationAddress: a.locationAddress || '',
      locationLat: a.locationLat ?? null,
      locationLng: a.locationLng ?? null,
      coordinateType: a.coordinateType || 'gcj02',
      locationProvider: a.locationProvider || 'manual',
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

  // GET /admin/activity/:id/registrations — V2.5A: return reg info snapshots
  @Get('activity/:id/registrations')
  async getRegistrations(@Param('id', ParseIntPipe) activityId: number) {
    const regInfos = await this.regInfoRepo.find({ where: { activityId }, order: { createdAt: 'DESC' } })
    return regInfos.map(r => ({
      id: r.id,
      registrationId: r.registrationId,
      userId: r.userId,
      realName: r.realName || null,
      phone: r.phone ? r.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null,
      idCardNo: maskIdCardNo(r.idCardNo),
      departureCity: r.departureCity || null,
      transportPreference: r.transportPreference || null,
      roomPreference: r.roomPreference || null,
      confirmedAt: r.confirmedAt,
    }))
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

  // POST /admin/activity/:id/checkin — Admin mobile verification
  @Post('activity/:id/checkin')
  async adminCheckin(
    @Param('id', ParseIntPipe) id: number,
    @Body('code') code: string,
  ) {
    if (!code) throw new BadRequestException('请提供核销码')
    const result = await this.flow.checkinForActivity(id, code)
    return { success: true, message: '签到成功', ...result }
  }

  // POST /admin/activity/upload-cover
  @Post('activity/upload-cover')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        const dir = ensureUploadSubDir('activity')
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
    return { url: toPublicUploadUrl('activity', file.filename) }
  }
}
