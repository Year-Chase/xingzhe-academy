import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { Activity } from './entities/activity.entity'
import { ActivityRegistration } from './entities/activity-registration.entity'

@Injectable()
export class ActivityService implements OnModuleInit {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(ActivityRegistration)
    private readonly regRepo: Repository<ActivityRegistration>,
  ) {}

  async onModuleInit() {
    const count = await this.activityRepo.count()
    if (count > 0) return

    const now = new Date()
    await this.activityRepo.save([
      {
        title: '🏃 奥森晨跑',
        description: '每周六早上7点在奥森南门集合，沿5km环线慢跑。适合所有水平的跑者，新手友好。请穿运动鞋，自带饮用水。',
        location: '奥林匹克森林公园南门',
        startTime: new Date(now.getTime() + 86400000),
        endTime: new Date(now.getTime() + 86400000 + 7200000),
        capacity: 30,
        status: 'active',
      },
      {
        title: '🚴 周末骑行',
        description: '沿温榆河绿道骑行30km，途经多个湿地公园。需自备自行车（或扫码共享单车），头盔必备。',
        location: '温榆河绿道入口',
        startTime: new Date(now.getTime() + 172800000),
        endTime: new Date(now.getTime() + 172800000 + 14400000),
        capacity: 20,
        status: 'active',
      },
      {
        title: '🧘 朝阳公园瑜伽',
        description: '在草坪上进行1小时流瑜伽，由持证教练带领。请自带瑜伽垫，建议穿宽松舒适衣物。',
        location: '朝阳公园中心草坪',
        startTime: new Date(now.getTime() + 259200000),
        endTime: new Date(now.getTime() + 259200000 + 3600000),
        capacity: 25,
        status: 'active',
      },
      {
        title: '⛰️ 香山徒步',
        description: '从香山邮局出发，经好汉坡登顶，全程约8km，累计爬升500m。有一定强度，要求参与者体能良好。',
        location: '香山邮局',
        startTime: new Date(now.getTime() + 604800000),
        endTime: new Date(now.getTime() + 604800000 + 21600000),
        capacity: 15,
        status: 'active',
      },
      {
        title: '🏊 游泳训练',
        description: '在英东游泳馆进行1.5小时游泳训练，含技术指导和自由泳练习。需自带泳衣、泳帽、泳镜。',
        location: '英东游泳馆',
        startTime: new Date(now.getTime() + 345600000),
        endTime: new Date(now.getTime() + 345600000 + 5400000),
        capacity: 12,
        status: 'active',
      },
    ])
    console.log('[ActivityService] Seeded 5 activities')
  }

  async getList(): Promise<Activity[]> {
    return this.activityRepo.find({
      where: [{ status: 'active' }, { status: 'PUBLISHED' }],
      order: { startTime: 'ASC' },
    })
  }

  async getAll(page: number, limit: number): Promise<{ items: Activity[]; total: number }> {
    const [items, total] = await this.activityRepo.findAndCount({
      order: { startTime: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    })
    return { items, total }
  }

  async getDetail(id: number): Promise<Activity> {
    const a = await this.activityRepo.findOne({ where: { id } })
    if (!a) throw new NotFoundException(`Activity ${id} not found`)
    return a
  }

  // ── Admin query methods ──

  async adminGetList(page: number, limit: number, status?: string, keyword?: string) {
    const qb = this.activityRepo.createQueryBuilder('a').orderBy('a.createdAt', 'DESC')
    if (status) qb.andWhere('a.status = :status', { status })
    if (keyword) {
      qb.andWhere('(a.title LIKE :kw OR a.location LIKE :kw2 OR a.description LIKE :kw3)', {
        kw: `%${keyword}%`, kw2: `%${keyword}%`, kw3: `%${keyword}%`,
      })
    }
    qb.skip((page - 1) * limit).take(limit)
    const [items, total] = await qb.getManyAndCount()
    return { items, total }
  }

  async adminCreate(dto: {
    title: string; description?: string; location: string
    startTime: string; endTime?: string; capacity: number; coverImage?: string
  }) {
    const a = this.activityRepo.create({
      title: dto.title,
      description: dto.description || '',
      location: dto.location,
      startTime: new Date(dto.startTime),
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
      capacity: dto.capacity,
      coverImage: dto.coverImage || '',
      status: 'DRAFT',
    })
    const saved = await this.activityRepo.save(a)
    return { id: saved.id, status: saved.status }
  }

  async adminUpdate(id: number, dto: {
    title?: string; description?: string; location?: string
    startTime?: string; endTime?: string; capacity?: number; coverImage?: string
  }) {
    const a = await this.activityRepo.findOne({ where: { id } })
    if (!a) throw new NotFoundException(`Activity ${id} not found`)

    if (dto.title !== undefined) a.title = dto.title
    if (dto.description !== undefined) a.description = dto.description
    if (dto.location !== undefined) a.location = dto.location
    if (dto.startTime !== undefined) a.startTime = new Date(dto.startTime)
    if (dto.endTime !== undefined) a.endTime = dto.endTime ? new Date(dto.endTime) : null as any
    if (dto.capacity !== undefined) {
      const registeredCount = await this.regRepo.count({
        where: { activityId: id, status: In(['PAID', 'CHECKED_IN']) },
      })
      if (dto.capacity < registeredCount) {
        throw new BadRequestException('capacity cannot be less than registered count')
      }
      a.capacity = dto.capacity
    }
    if (dto.coverImage !== undefined) a.coverImage = dto.coverImage

    await this.activityRepo.save(a)
    return { id, updated: true }
  }

  async adminPublish(id: number) {
    const a = await this.activityRepo.findOne({ where: { id } })
    if (!a) throw new NotFoundException(`Activity ${id} not found`)
    if (a.status === 'PUBLISHED') return { id, status: 'PUBLISHED' }
    a.status = 'PUBLISHED'
    await this.activityRepo.save(a)
    return { id, status: 'PUBLISHED' }
  }

  async adminClose(id: number) {
    const a = await this.activityRepo.findOne({ where: { id } })
    if (!a) throw new NotFoundException(`Activity ${id} not found`)
    if (a.status === 'CLOSED') return { id, status: 'CLOSED' }
    a.status = 'CLOSED'
    await this.activityRepo.save(a)
    return { id, status: 'CLOSED' }
  }
}
