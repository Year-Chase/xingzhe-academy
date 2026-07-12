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
    // Only seed demo activities when explicitly enabled for local dev.
    // Production must never auto-create fake data.
    if (process.env.ENABLE_DEMO_SEED !== 'true') return

    const count = await this.activityRepo.count()
    if (count > 0) return
    const now = new Date()
    await this.activityRepo.save([
      {
        title: '🏃 奥森晨跑',
        description: '每周六早上7点在奥森南门集合，沿5km环线慢跑。适合所有水平的跑者，新手友好。请穿运动鞋，自带饮用水。',
        location: '奥林匹克森林公园南门', city: '北京',
        startTime: new Date(now.getTime() + 86400000),
        endTime: new Date(now.getTime() + 86400000 + 7200000),
        registrationStartTime: new Date(now.getTime() - 86400000),
        registrationEndTime: new Date(now.getTime() + 86400000),
        capacity: 30, status: 'PUBLISHED',
      },
      {
        title: '🚴 周末骑行',
        description: '沿温榆河绿道骑行30km，途经多个湿地公园。需自备自行车（或扫码共享单车），头盔必备。',
        location: '温榆河绿道入口', city: '北京',
        startTime: new Date(now.getTime() + 172800000),
        endTime: new Date(now.getTime() + 172800000 + 14400000),
        registrationStartTime: new Date(now.getTime()),
        registrationEndTime: new Date(now.getTime() + 172800000),
        capacity: 20, status: 'PUBLISHED',
      },
      {
        title: '🧘 朝阳公园瑜伽',
        description: '在草坪上进行1小时流瑜伽，由持证教练带领。请自带瑜伽垫，建议穿宽松舒适衣物。',
        location: '朝阳公园中心草坪', city: '北京',
        startTime: new Date(now.getTime() + 259200000),
        endTime: new Date(now.getTime() + 259200000 + 3600000),
        registrationStartTime: new Date(now.getTime()),
        registrationEndTime: new Date(now.getTime() + 259200000),
        capacity: 25, status: 'PUBLISHED',
      },
      {
        title: '⛰️ 香山徒步',
        description: '从香山邮局出发，经好汉坡登顶，全程约8km，累计爬升500m。有一定强度，要求参与者体能良好。',
        location: '香山邮局', city: '北京',
        startTime: new Date(now.getTime() + 604800000),
        endTime: new Date(now.getTime() + 604800000 + 21600000),
        registrationStartTime: new Date(now.getTime()),
        registrationEndTime: new Date(now.getTime() + 604800000),
        capacity: 15, status: 'PUBLISHED',
      },
      {
        title: '🏊 游泳训练',
        description: '在英东游泳馆进行1.5小时游泳训练，含技术指导和自由泳练习。需自带泳衣、泳帽、泳镜。',
        location: '英东游泳馆', city: '北京',
        startTime: new Date(now.getTime() + 345600000),
        endTime: new Date(now.getTime() + 345600000 + 5400000),
        registrationStartTime: new Date(now.getTime()),
        registrationEndTime: new Date(now.getTime() + 345600000),
        capacity: 12, status: 'PUBLISHED',
      },
    ] as any)
    console.log('[ActivityService] Seeded 5 demo activities')
  }

  // ── WeApp facing ──

  /** Unified: can this activity be enrolled now? (also used for display filtering) */
  canDisplay(a: Activity, now: Date): boolean {
    if (a.status !== 'PUBLISHED') return false
    if (a.endTime && new Date(a.endTime) <= now) return false
    if (a.registrationStartTime && new Date(a.registrationStartTime) > now) return false
    if (a.registrationEndTime && new Date(a.registrationEndTime) < now) return false
    return true
  }

  async getList(): Promise<Activity[]> {
    const now = new Date()
    const items = await this.activityRepo
      .createQueryBuilder('a')
      .where('a.status = :pub', { pub: 'PUBLISHED' })
      .getMany()
    return items.filter((a) => this.canDisplay(a, now))
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
  }

  async getAll(page: number, limit: number, opts?: { ongoing?: boolean }): Promise<{ items: Activity[]; total: number }> {
    const now = new Date()
    const qb = this.activityRepo.createQueryBuilder('a')
      .where('a.status = :pub', { pub: 'PUBLISHED' })
      .orderBy('a.createdAt', 'DESC')
    // V2.8-A: optional ongoing filter — backend pagination before frontend rendering
    if (opts?.ongoing) {
      qb.andWhere('(a.endTime IS NULL OR a.endTime >= :now)', { now: now.toISOString() })
    }
    qb.skip((page - 1) * limit).take(limit)
    const [items, total] = await qb.getManyAndCount()
    return { items, total }
  }

  async getDetail(id: number): Promise<Activity> {
    const a = await this.activityRepo.findOne({ where: { id } })
    if (!a) throw new NotFoundException(`Activity ${id} not found`)
    return a
  }

  // ── Admin query methods ──

  /** Compute effective status: override with ENDED if endTime has passed */
  effectiveStatus(a: Activity): string {
    const now = new Date()
    if (a.endTime && new Date(a.endTime) <= now && a.status !== 'DRAFT') return 'ENDED'
    return a.status
  }

  private normalizePostpayDate(value: unknown): string | null | undefined {
    if (value === undefined) return undefined
    if (value === null || value === '') return null
    if (typeof value !== 'string') throw new BadRequestException('后付款日期格式无效')
    const raw = value.trim()
    if (!raw) return null
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
    const dt = new Date(raw)
    if (Number.isNaN(dt.getTime())) throw new BadRequestException('后付款日期格式无效')
    const beijing = new Date(dt.getTime() + 8 * 60 * 60 * 1000)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${beijing.getUTCFullYear()}-${pad(beijing.getUTCMonth() + 1)}-${pad(beijing.getUTCDate())}`
  }

  async adminGetList(page: number, limit: number, status?: string, keyword?: string) {
    const qb = this.activityRepo.createQueryBuilder('a').orderBy('a.createdAt', 'DESC')
    if (status) {
      qb.andWhere('a.status = :status', { status })
    }
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
    title: string; slogan?: string; province?: string; description?: string; location: string; city?: string
    startTime: string; endTime: string; registrationStartTime: string; registrationEndTime: string
    capacity: number; coverImage?: string; price?: number; memberPrice?: number
    lifetimeMemberPrice?: number; paymentMode?: string
    prepayAmount?: number; remainingAmount?: number; remainingPayDate?: string
    memoryImages?: string; memoryText?: string
    requiredUserInfoFields?: string[]; groupQrType?: string; groupQrImageUrl?: string
    groupQrTitle?: string; groupQrDescription?: string
    certificateTemplateId?: number
    provinceName?: string; provinceCode?: string; cityName?: string; cityCode?: string
    adcode?: string; lng?: number; lat?: number
    locationName?: string; locationAddress?: string; locationLat?: number; locationLng?: number
    coordinateType?: string; locationProvider?: string
    imageUrls?: string; contentBlocks?: string; pricingRules?: string
    postpayDate?: string
  }) {
    if (dto.slogan && dto.slogan.length > 100) throw new BadRequestException('slogan must be <= 100 chars')
    const st = new Date(dto.startTime), et = new Date(dto.endTime)
    const rs = new Date(dto.registrationStartTime), re = new Date(dto.registrationEndTime)
    if (et <= st) throw new BadRequestException('活动结束时间必须晚于活动开始时间')
    if (re <= rs) throw new BadRequestException('报名结束时间必须晚于报名开始时间')
    const a = this.activityRepo.create({
      title: dto.title,
      slogan: dto.slogan || '',
      province: dto.province || '',
      description: dto.description || '',
      location: dto.location,
      city: dto.city || '',
      startTime: st,
      endTime: et,
      registrationStartTime: rs,
      registrationEndTime: re,
      capacity: dto.capacity,
      coverImage: dto.coverImage || '',
      price: dto.price ?? 0,
      memberPrice: dto.memberPrice ?? 0,
      lifetimeMemberPrice: dto.lifetimeMemberPrice ?? 0,
      paymentMode: dto.paymentMode || 'FULL',
      prepayAmount: dto.prepayAmount ?? 0,
      remainingAmount: dto.remainingAmount ?? 0,
      remainingPayDate: dto.remainingPayDate ? new Date(dto.remainingPayDate) : null,
      memoryImages: dto.memoryImages || null,
      memoryText: dto.memoryText || null,
      requiredUserInfoFields: Array.isArray(dto.requiredUserInfoFields) ? JSON.stringify(dto.requiredUserInfoFields) : null,
      groupQrType: dto.groupQrType || 'NONE',
      groupQrImageUrl: dto.groupQrImageUrl || null,
      groupQrTitle: dto.groupQrTitle || '加入活动群',
      groupQrDescription: dto.groupQrDescription || '活动通知、集合安排和现场事项将在群内同步',
      certificateTemplateId: dto.certificateTemplateId ?? null,
      provinceName: dto.provinceName || dto.province || null,
      provinceCode: dto.provinceCode || null,
      cityName: dto.cityName || dto.city || null,
      cityCode: dto.cityCode || null,
      adcode: dto.adcode || null,
      lng: dto.lng ?? null,
      lat: dto.lat ?? null,
      locationName: dto.locationName || null,
      locationAddress: dto.locationAddress || null,
      locationLat: dto.locationLat ?? null,
      locationLng: dto.locationLng ?? null,
      coordinateType: dto.coordinateType || 'gcj02',
      locationProvider: dto.locationProvider || 'manual',
      imageUrls: dto.imageUrls ?? null,
      contentBlocks: dto.contentBlocks ?? null,
      pricingRules: dto.pricingRules ?? null,
      postpayDate: this.normalizePostpayDate(dto.postpayDate) ?? null,
      status: 'DRAFT',
    } as any)
    const saved: any = await this.activityRepo.save(a)
    return { id: saved.id, status: saved.status }
  }

  async adminUpdate(id: number, dto: {
    title?: string; slogan?: string; province?: string; description?: string; location?: string; city?: string
    startTime?: string; endTime?: string; registrationStartTime?: string; registrationEndTime?: string
    capacity?: number; coverImage?: string; price?: number; memberPrice?: number
    lifetimeMemberPrice?: number; paymentMode?: string
    prepayAmount?: number; remainingAmount?: number; remainingPayDate?: string
    memoryImages?: string; memoryText?: string
    requiredUserInfoFields?: string[]; groupQrType?: string; groupQrImageUrl?: string
    groupQrTitle?: string; groupQrDescription?: string
    certificateTemplateId?: number
    provinceName?: string; provinceCode?: string; cityName?: string; cityCode?: string
    adcode?: string; lng?: number; lat?: number
    locationName?: string; locationAddress?: string; locationLat?: number; locationLng?: number
    coordinateType?: string; locationProvider?: string
    imageUrls?: string; contentBlocks?: string; pricingRules?: string
    postpayDate?: string
  }) {
    const a = await this.activityRepo.findOne({ where: { id } })
    if (!a) throw new NotFoundException(`Activity ${id} not found`)
    if (dto.slogan !== undefined && dto.slogan.length > 100) throw new BadRequestException('slogan must be <= 100 chars')

    if (dto.title !== undefined) a.title = dto.title
    if (dto.slogan !== undefined) a.slogan = dto.slogan
    if (dto.province !== undefined) a.province = dto.province
    if (dto.description !== undefined) a.description = dto.description
    if (dto.location !== undefined) a.location = dto.location
    if (dto.city !== undefined) a.city = dto.city
    if (dto.startTime !== undefined) a.startTime = new Date(dto.startTime)
    if (dto.endTime !== undefined) a.endTime = new Date(dto.endTime)
    if (dto.registrationStartTime !== undefined) a.registrationStartTime = new Date(dto.registrationStartTime)
    if (dto.registrationEndTime !== undefined) a.registrationEndTime = new Date(dto.registrationEndTime)
    // time validation
    const st = a.startTime, et = a.endTime
    const rs = a.registrationStartTime, re = a.registrationEndTime
    if (st && et && et <= st) throw new BadRequestException('活动结束时间必须晚于活动开始时间')
    if (rs && re && re <= rs) throw new BadRequestException('报名结束时间必须晚于报名开始时间')
    if (dto.capacity !== undefined) {
      const registeredCount = await this.regRepo.count({
        where: { activityId: id, status: In(['PAID', 'CHECKED_IN']) },
      })
      if (dto.capacity < registeredCount) throw new BadRequestException('capacity cannot be less than registered count')
      a.capacity = dto.capacity
    }
    if (dto.coverImage !== undefined) a.coverImage = dto.coverImage
    if (dto.price !== undefined) a.price = dto.price
    if (dto.memberPrice !== undefined) a.memberPrice = dto.memberPrice
    if (dto.lifetimeMemberPrice !== undefined) a.lifetimeMemberPrice = dto.lifetimeMemberPrice
    if (dto.paymentMode !== undefined) a.paymentMode = dto.paymentMode
    if (dto.prepayAmount !== undefined) a.prepayAmount = dto.prepayAmount
    if (dto.remainingAmount !== undefined) a.remainingAmount = dto.remainingAmount
    if (dto.remainingPayDate !== undefined) a.remainingPayDate = dto.remainingPayDate ? new Date(dto.remainingPayDate) : null
    if (dto.memoryImages !== undefined) a.memoryImages = dto.memoryImages || null
    if (dto.memoryText !== undefined) a.memoryText = dto.memoryText || null
    if (dto.requiredUserInfoFields !== undefined) a.requiredUserInfoFields = Array.isArray(dto.requiredUserInfoFields) ? JSON.stringify(dto.requiredUserInfoFields) : null
    if (dto.groupQrType !== undefined) a.groupQrType = dto.groupQrType
    if (dto.groupQrImageUrl !== undefined) a.groupQrImageUrl = dto.groupQrImageUrl || null
    if (dto.groupQrTitle !== undefined) a.groupQrTitle = dto.groupQrTitle
    if (dto.groupQrDescription !== undefined) a.groupQrDescription = dto.groupQrDescription
    if (dto.certificateTemplateId !== undefined) a.certificateTemplateId = dto.certificateTemplateId
    if (dto.imageUrls !== undefined) a.imageUrls = dto.imageUrls ?? null
    if (dto.contentBlocks !== undefined) a.contentBlocks = dto.contentBlocks ?? null
    if (dto.pricingRules !== undefined) a.pricingRules = dto.pricingRules ?? null
    if (dto.postpayDate !== undefined) a.postpayDate = this.normalizePostpayDate(dto.postpayDate) ?? null
    if (dto.provinceName !== undefined) { a.provinceName = dto.provinceName; a.province = dto.provinceName }
    if (dto.provinceCode !== undefined) a.provinceCode = dto.provinceCode
    if (dto.cityName !== undefined) { a.cityName = dto.cityName; a.city = dto.cityName }
    if (dto.cityCode !== undefined) a.cityCode = dto.cityCode
    if (dto.adcode !== undefined) a.adcode = dto.adcode
    if (dto.lng !== undefined) a.lng = dto.lng
    if (dto.lat !== undefined) a.lat = dto.lat
    if (dto.locationName !== undefined) a.locationName = dto.locationName
    if (dto.locationAddress !== undefined) a.locationAddress = dto.locationAddress
    if (dto.locationLat !== undefined) a.locationLat = dto.locationLat
    if (dto.locationLng !== undefined) a.locationLng = dto.locationLng
    if (dto.coordinateType !== undefined) a.coordinateType = dto.coordinateType
    if (dto.locationProvider !== undefined) a.locationProvider = dto.locationProvider

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
