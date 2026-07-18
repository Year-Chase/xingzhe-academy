import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ActivityCategory } from './entities/activity-category.entity'
import { Activity } from './entities/activity.entity'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('admin/dictionary')
@UseGuards(JwtAuthGuard)
export class AdminDictionaryController {
  constructor(
    @InjectRepository(ActivityCategory)
    private readonly categoryRepo: Repository<ActivityCategory>,
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
  ) {}

  @Get('activity-categories')
  async list() {
    const categories = await this.categoryRepo.find({ order: { sortOrder: 'ASC', updatedAt: 'DESC' } })
    const rows = await Promise.all(categories.map(async (c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      description: c.description || '',
      sortOrder: c.sortOrder,
      status: c.status,
      activityCount: await this.activityRepo.count({ where: { categoryId: c.id } as any }),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })))
    return rows
  }

  @Get('activity-categories/active')
  async active() {
    const categories = await this.categoryRepo.find({ where: { status: 'ACTIVE' }, order: { sortOrder: 'ASC', updatedAt: 'DESC' } })
    return categories.map((c) => ({ id: c.id, name: c.name, code: c.code }))
  }

  @Post('activity-categories')
  async create(@Body() body: any) {
    const name = String(body?.name || '').trim()
    const code = String(body?.code || '').trim()
    if (!name) throw new BadRequestException('分类名称不能为空')
    if (!code) throw new BadRequestException('分类编码不能为空')
    const existing = await this.categoryRepo.findOne({ where: { code } })
    if (existing) throw new BadRequestException('分类编码已存在')
    const category = this.categoryRepo.create({
      name,
      code,
      description: String(body?.description || '').trim() || null,
      sortOrder: Number(body?.sortOrder || 0),
      status: body?.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    })
    return this.categoryRepo.save(category)
  }

  @Patch('activity-categories/:id')
  async update(@Param('id') id: string, @Body() body: any) {
    const category = await this.categoryRepo.findOne({ where: { id } as any })
    if (!category) throw new BadRequestException('分类不存在')
    if (body?.name !== undefined) {
      const name = String(body.name || '').trim()
      if (!name) throw new BadRequestException('分类名称不能为空')
      category.name = name
    }
    if (body?.description !== undefined) category.description = String(body.description || '').trim() || null
    if (body?.sortOrder !== undefined) category.sortOrder = Number(body.sortOrder || 0)
    if (body?.status !== undefined) category.status = body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
    return this.categoryRepo.save(category)
  }

  @Delete('activity-categories/:id')
  async remove(@Param('id') id: string) {
    const count = await this.activityRepo.count({ where: { categoryId: id } as any })
    if (count > 0) throw new BadRequestException('分类已被使用，不允许删除')
    throw new BadRequestException('活动分类不允许物理删除，请停用')
  }
}
