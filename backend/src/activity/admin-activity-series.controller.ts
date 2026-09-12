import { BadRequestException, Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Like, Repository } from 'typeorm'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Activity } from './entities/activity.entity'
import { ActivitySeries } from './entities/activity-series.entity'

@Controller('admin/activity-series')
@UseGuards(JwtAuthGuard)
export class AdminActivitySeriesController {
  constructor(
    @InjectRepository(ActivitySeries)
    private readonly seriesRepo: Repository<ActivitySeries>,
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
  ) {}

  @Get()
  async list() {
    const rows = await this.seriesRepo.find({ order: { sortOrder: 'ASC', updatedAt: 'DESC' } })
    return Promise.all(rows.map(async (s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      coverImage: s.coverImage || '',
      shortDescription: s.shortDescription || '',
      description: s.description || '',
      externalUrl: s.externalUrl || '',
      sortOrder: s.sortOrder,
      status: s.status,
      showActivities: s.showActivities !== false,
      activityCount: await this.activityRepo.count({ where: { seriesId: s.id } as any }),
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })))
  }

  @Get('active')
  async active() {
    const rows = await this.seriesRepo.find({ where: { status: 'ACTIVE' }, order: { sortOrder: 'ASC', updatedAt: 'DESC' } })
    return rows.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      coverImage: s.coverImage || '',
      shortDescription: s.shortDescription || '',
      externalUrl: s.externalUrl || '',
      sortOrder: s.sortOrder,
    }))
  }

  @Post()
  async create(@Body() body: any) {
    const payload = await this.normalizePayload(body, true)
    payload.code = await this.generateSeriesCode()
    const series = this.seriesRepo.create(payload)
    try {
      return await this.seriesRepo.save(series)
    } catch (e: any) {
      if (String(e?.code || '') === 'ER_DUP_ENTRY' || String(e?.message || '').includes('UNIQUE')) {
        const retryPayload = { ...payload, code: await this.generateSeriesCode() }
        return this.seriesRepo.save(this.seriesRepo.create(retryPayload))
      }
      throw e
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const series = await this.seriesRepo.findOne({ where: { id: Number(id) } as any })
    if (!series) throw new BadRequestException('活动系列不存在')
    const payload = await this.normalizePayload(body, false, series.id)
    Object.assign(series, payload)
    return this.seriesRepo.save(series)
  }

  private async normalizePayload(body: any, creating: boolean, currentId?: number): Promise<Partial<ActivitySeries>> {
    const next: Partial<ActivitySeries> = {}
    if (creating || body?.name !== undefined) {
      const name = String(body?.name || '').trim()
      if (!name) throw new BadRequestException('系列名称不能为空')
      next.name = name
    }
    if (!creating && body?.code !== undefined) {
      const code = String(body?.code || '').trim()
      if (!code) throw new BadRequestException('系列编码不能为空')
      const existing = await this.seriesRepo.findOne({ where: { code } })
      if (existing && String(existing.id) !== String(currentId || '')) throw new BadRequestException('系列编码已存在')
      next.code = code
    }
    if (body?.coverImage !== undefined) next.coverImage = String(body.coverImage || '').trim() || null
    if (body?.shortDescription !== undefined) {
      const shortDescription = String(body.shortDescription || '').trim()
      if (shortDescription.length > 50) throw new BadRequestException('品牌一句话介绍最多50字')
      next.shortDescription = shortDescription || null
    }
    if (body?.description !== undefined) next.description = String(body.description || '').trim() || null
    if (body?.externalUrl !== undefined) {
      const externalUrl = String(body.externalUrl || '').trim()
      if (externalUrl.length > 500) throw new BadRequestException('品牌跳转链接最多500个字符')
      if (externalUrl) {
        try {
          if (new URL(externalUrl).protocol !== 'https:') throw new Error('protocol')
        } catch {
          throw new BadRequestException('品牌跳转链接必须为 https 地址')
        }
      }
      next.externalUrl = externalUrl || null
    }
    if (body?.sortOrder !== undefined) next.sortOrder = Number(body.sortOrder || 0)
    if (body?.status !== undefined) next.status = body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
    if (body?.showActivities !== undefined) next.showActivities = body.showActivities === true || body.showActivities === 'true' || body.showActivities === 1
    return next
  }

  private async generateSeriesCode(): Promise<string> {
    const rows = await this.seriesRepo.find({
      where: { code: Like('SERIES%') },
      select: ['code'],
      order: { id: 'DESC' },
      take: 200,
    })
    const max = rows.reduce((acc, row) => {
      const match = /^SERIES(\d+)$/.exec(row.code || '')
      return match ? Math.max(acc, Number(match[1])) : acc
    }, 0)
    const base = Math.max(max + 1, Date.now() % 1000000)
    for (let i = 0; i < 20; i += 1) {
      const code = `SERIES${String(base + i).padStart(6, '0')}`
      const existing = await this.seriesRepo.findOne({ where: { code } })
      if (!existing) return code
    }
    return `SERIES${Date.now()}`
  }
}
