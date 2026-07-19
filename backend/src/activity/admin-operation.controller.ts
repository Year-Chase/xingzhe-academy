import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Activity } from './entities/activity.entity'
import { ActivityCategory } from './entities/activity-category.entity'
import { OperationBanner, OperationBannerJumpType } from './entities/operation-banner.entity'

@Controller('admin/operation')
@UseGuards(JwtAuthGuard)
export class AdminOperationController {
  constructor(
    @InjectRepository(OperationBanner)
    private readonly bannerRepo: Repository<OperationBanner>,
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(ActivityCategory)
    private readonly categoryRepo: Repository<ActivityCategory>,
  ) {}

  @Get('banners')
  async list() {
    return this.bannerRepo.find({ order: { sortOrder: 'ASC', updatedAt: 'DESC' } })
  }

  @Post('banners')
  async create(@Body() body: any) {
    const normalized = await this.normalizeBannerPayload(body, true)
    const banner = this.bannerRepo.create(normalized)
    return this.bannerRepo.save(banner)
  }

  @Patch('banners/:id')
  async update(@Param('id') id: string, @Body() body: any) {
    const banner = await this.bannerRepo.findOne({ where: { id } as any })
    if (!banner) throw new BadRequestException('Banner不存在')
    const normalized = await this.normalizeBannerPayload(body, false)
    Object.assign(banner, normalized)
    return this.bannerRepo.save(banner)
  }

  @Delete('banners/:id')
  async remove(@Param('id') id: string) {
    const banner = await this.bannerRepo.findOne({ where: { id } as any })
    if (!banner) throw new BadRequestException('Banner不存在')
    await this.bannerRepo.delete({ id } as any)
    return { deleted: true }
  }

  private async normalizeBannerPayload(body: any, creating: boolean): Promise<Partial<OperationBanner>> {
    const next: Partial<OperationBanner> = {}
    if (creating || body?.imageUrl !== undefined) {
      const imageUrl = String(body?.imageUrl || '').trim()
      if (!imageUrl) throw new BadRequestException('Banner图片不能为空')
      next.imageUrl = imageUrl
    }
    if (creating || body?.title !== undefined) {
      const title = String(body?.title || '').trim()
      if (!title) throw new BadRequestException('Banner标题不能为空')
      next.title = title
    }
    if (body?.description !== undefined) next.description = String(body.description || '').trim() || null
    if (body?.sortOrder !== undefined) next.sortOrder = Number(body.sortOrder || 0)
    if (body?.status !== undefined) next.status = body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
    if (body?.startAt !== undefined) next.startAt = this.normalizeDate(body.startAt)
    if (body?.endAt !== undefined) next.endAt = this.normalizeDate(body.endAt)

    if (creating || body?.jumpType !== undefined || body?.jumpValue !== undefined) {
      const jumpType = (body?.jumpType || 'NONE') as OperationBannerJumpType
      if (!['NONE', 'ACTIVITY', 'CATEGORY', 'SERIES'].includes(jumpType)) throw new BadRequestException('Banner跳转类型无效')
      if (jumpType === 'SERIES') throw new BadRequestException('活动系列为预留能力，当前版本暂不可配置')
      const jumpValue = String(body?.jumpValue || '').trim()
      if (jumpType !== 'NONE' && !jumpValue) throw new BadRequestException('请填写跳转目标')
      if (jumpType === 'ACTIVITY') {
        const activity = await this.activityRepo.findOne({ where: { id: Number(jumpValue) } as any })
        if (!activity) throw new BadRequestException('跳转活动不存在')
      }
      if (jumpType === 'CATEGORY') {
        const category = await this.categoryRepo.findOne({ where: { id: String(jumpValue) } as any })
        if (!category || category.status !== 'ACTIVE') throw new BadRequestException('跳转分类不存在或已停用')
      }
      next.jumpType = jumpType
      next.jumpValue = jumpType === 'NONE' ? null : jumpValue
    }

    if (next.startAt && next.endAt && next.endAt <= next.startAt) {
      throw new BadRequestException('展示结束时间必须晚于开始时间')
    }
    return next
  }

  private normalizeDate(value: unknown): Date | null {
    if (value === null || value === undefined || value === '') return null
    const date = new Date(String(value))
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Banner展示时间无效')
    return date
  }
}
