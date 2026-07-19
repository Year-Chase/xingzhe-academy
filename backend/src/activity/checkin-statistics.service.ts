import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { Activity } from './entities/activity.entity'
import { ActivityRegistration, RegistrationStatus } from './entities/activity-registration.entity'
import { ActivityOrder } from './entities/activity-order.entity'
import { ActivityRefund } from './entities/activity-refund.entity'
import { ActivityRegistrationInfo } from './entities/activity-registration-info.entity'
import { User } from '../users/entities/user.entity'

type CheckinRecordStatus = 'CHECKED_IN' | 'NOT_CHECKED_IN'
type CheckinRecordSort = 'CHECKIN_DESC' | 'REGISTRATION_DESC'

type CheckinRecordFilters = {
  page?: number
  limit?: number
  status?: CheckinRecordStatus | string
  keyword?: string
  sort?: CheckinRecordSort | string
}

const INVALID_REGISTRATION_STATUSES = new Set(['CANCELLED', 'EXPIRED'])
const VALID_REGISTRATION_STATUSES: RegistrationStatus[] = ['REGISTERED', 'PAID', 'CHECKED_IN']

@Injectable()
export class CheckinStatisticsService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(ActivityRegistration)
    private readonly regRepo: Repository<ActivityRegistration>,
    @InjectRepository(ActivityOrder)
    private readonly orderRepo: Repository<ActivityOrder>,
    @InjectRepository(ActivityRefund)
    private readonly refundRepo: Repository<ActivityRefund>,
    @InjectRepository(ActivityRegistrationInfo)
    private readonly regInfoRepo: Repository<ActivityRegistrationInfo>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private money(value: unknown): number {
    const n = Number(value ?? 0)
    return Number.isFinite(n) ? n : 0
  }

  private maskPhone(phone?: string | null): string | null {
    if (!phone) return null
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  }

  private isValidRegistration(status?: string | null): boolean {
    return !INVALID_REGISTRATION_STATUSES.has(String(status || '').toUpperCase())
  }

  private isCheckedIn(reg: ActivityRegistration): boolean {
    return reg.status === 'CHECKED_IN'
  }

  private refundStatus(order: ActivityOrder | undefined, refundSum: number): string {
    if (!order) return '-'
    if (refundSum <= 0) return order.status || '-'
    const paid = this.money(order.amount)
    if (paid > 0 && refundSum >= paid) return 'REFUNDED'
    return 'PARTIAL_REFUND'
  }

  private sourceLabel(source?: string | null): string {
    if (source === 'MINIAPP_STAFF') return '工作人员核销'
    if (source === 'ADMIN') return 'Admin核销'
    return source || '-'
  }

  private async getActivityOrThrow(activityId: number) {
    const activity = await this.activityRepo.findOne({ where: { id: activityId }, relations: ['category'] })
    if (!activity) throw new NotFoundException('活动不存在')
    return activity
  }

  private async requireStaff(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId as any } })
    if (!user || user.identityType !== '工作人员') throw new ForbiddenException('无工作人员权限')
    return user
  }

  async getStatistics(activityId: number) {
    const activity = await this.getActivityOrThrow(activityId)
    const [registrations, orders, refunds] = await Promise.all([
      this.regRepo.find({ where: { activityId } }),
      this.orderRepo.find({ where: { activityId } }),
      this.refundRepo.find({ where: { activityId, status: 'SUCCESS' as any } }),
    ])

    const orderByRegistrationId = new Map<number, ActivityOrder>()
    for (const order of orders) orderByRegistrationId.set(order.registrationId, order)

    const refundedOrderIds = new Set(refunds.map(refund => refund.orderId))
    const totalRegistrations = registrations.length
    const validRegistrations = registrations.filter(reg => this.isValidRegistration(reg.status)).length
    const checkedInRegistrations = registrations.filter(reg => this.isCheckedIn(reg))
    const checkedInCount = checkedInRegistrations.length
    const uncheckedCount = Math.max(validRegistrations - checkedInCount, 0)
    const checkinRate = validRegistrations > 0 ? Number((checkedInCount / validRegistrations).toFixed(4)) : 0
    const staffCheckinCount = checkedInRegistrations.filter(reg => reg.checkinSource === 'MINIAPP_STAFF').length
    const adminCheckinCount = checkedInRegistrations.filter(reg => reg.checkinSource === 'ADMIN').length
    const unpaidPostpayCheckedInCount = checkedInRegistrations.filter((reg) => {
      const order = orderByRegistrationId.get(reg.id)
      return order?.payType === 'PREPAY' && order.postpayStatus === 'UNPAID'
    }).length
    const refundedCheckedInCount = checkedInRegistrations.filter((reg) => {
      const order = orderByRegistrationId.get(reg.id)
      return order ? refundedOrderIds.has(order.id) : false
    }).length

    return {
      activity: {
        id: activity.id,
        title: activity.title,
        startTime: activity.startTime || null,
        endTime: activity.endTime || null,
        status: activity.status,
        category: activity.category ? { id: activity.category.id, name: activity.category.name } : null,
      },
      activityId,
      totalRegistrations,
      validRegistrations,
      checkedInCount,
      uncheckedCount,
      checkinRate,
      staffCheckinCount,
      adminCheckinCount,
      unpaidPostpayCheckedInCount,
      refundedCheckedInCount,
    }
  }

  async getStaffStatistics(userId: string, activityId: number) {
    await this.requireStaff(userId)
    const stats = await this.getStatistics(activityId)
    return {
      activityId: stats.activityId,
      validRegistrations: stats.validRegistrations,
      checkedInCount: stats.checkedInCount,
      uncheckedCount: stats.uncheckedCount,
      checkinRate: stats.checkinRate,
    }
  }

  async getRecords(activityId: number, filters: CheckinRecordFilters) {
    await this.getActivityOrThrow(activityId)
    const page = Math.max(1, Number(filters.page || 1))
    const limit = Math.min(100, Math.max(1, Number(filters.limit || 20)))
    const keyword = String(filters.keyword || '').trim()
    const status = String(filters.status || '').trim().toUpperCase()
    const sort = String(filters.sort || 'CHECKIN_DESC').trim().toUpperCase()

    const qb = this.regRepo.createQueryBuilder('reg')
      .where('reg.activityId = :activityId', { activityId })
      .leftJoin(ActivityOrder, 'ord', 'ord.registrationId = reg.id')
      .leftJoin(User, 'user', 'user.id = reg.userId')
      .leftJoin(ActivityRegistrationInfo, 'regInfo', 'regInfo.registrationId = reg.id')

    if (status === 'CHECKED_IN') {
      qb.andWhere('reg.status = :checkedIn', { checkedIn: 'CHECKED_IN' })
    } else if (status === 'NOT_CHECKED_IN') {
      qb.andWhere('reg.status IN (:...validStatuses)', { validStatuses: VALID_REGISTRATION_STATUSES })
      qb.andWhere('reg.status != :checkedIn', { checkedIn: 'CHECKED_IN' })
    }

    if (keyword) {
      qb.andWhere('(user.nickname LIKE :kw OR user.phone LIKE :kw OR regInfo.phone LIKE :kw)', { kw: `%${keyword}%` })
    }

    if (sort === 'REGISTRATION_DESC') {
      qb.orderBy('reg.createdAt', 'DESC').addOrderBy('reg.id', 'DESC')
    } else {
      qb.orderBy('reg.checkedInAt', 'DESC').addOrderBy('reg.createdAt', 'DESC').addOrderBy('reg.id', 'DESC')
    }

    qb.skip((page - 1) * limit).take(limit)
    const [registrations, total] = await qb.getManyAndCount()
    const registrationIds = registrations.map(reg => reg.id)
    const userIds = [...new Set(registrations.map(reg => reg.userId).filter(Boolean))]

    const [orders, regInfos, users, staffUsers] = await Promise.all([
      registrationIds.length > 0 ? this.orderRepo.find({ where: { registrationId: In(registrationIds) } }) : Promise.resolve([]),
      registrationIds.length > 0 ? this.regInfoRepo.find({ where: { registrationId: In(registrationIds) } }) : Promise.resolve([]),
      userIds.length > 0 ? this.userRepo.find({ where: userIds.map(id => ({ id } as any)) }) : Promise.resolve([]),
      Promise.resolve([] as User[]),
    ])

    const orderByRegistrationId = new Map<number, ActivityOrder>()
    for (const order of orders) orderByRegistrationId.set(order.registrationId, order)
    const orderIds = orders.map(order => order.id)
    const refunds = orderIds.length > 0 ? await this.refundRepo.find({ where: { orderId: In(orderIds), status: 'SUCCESS' as any } }) : []
    const refundSumByOrderId = new Map<number, number>()
    for (const refund of refunds) {
      refundSumByOrderId.set(refund.orderId, (refundSumByOrderId.get(refund.orderId) || 0) + this.money(refund.amount))
    }

    const regInfoByRegistrationId = new Map<number, ActivityRegistrationInfo>()
    for (const info of regInfos) regInfoByRegistrationId.set(info.registrationId, info)
    const userById = new Map<string, User>()
    for (const user of users) userById.set(user.id, user)

    const staffIds = [...new Set(registrations.map(reg => reg.checkedInByUserId).filter(Boolean))] as string[]
    const loadedStaffUsers = staffIds.length > 0 ? await this.userRepo.find({ where: staffIds.map(id => ({ id } as any)) }) : staffUsers
    const staffById = new Map<string, User>()
    for (const user of loadedStaffUsers) staffById.set(user.id, user)

    const items = registrations.map((reg) => {
      const user = userById.get(reg.userId)
      const info = regInfoByRegistrationId.get(reg.id)
      const order = orderByRegistrationId.get(reg.id)
      const refundSum = order ? (refundSumByOrderId.get(order.id) || 0) : 0
      const staff = reg.checkedInByUserId ? staffById.get(reg.checkedInByUserId) : null
      return {
        id: reg.id,
        registrationId: reg.id,
        userId: reg.userId,
        nickname: user?.nickname || '行者',
        phoneMasked: this.maskPhone(info?.phone || user?.phone || null),
        registeredAt: reg.createdAt,
        registrationStatus: reg.status,
        checkinStatus: reg.status === 'CHECKED_IN' ? 'CHECKED_IN' : 'NOT_CHECKED_IN',
        checkedInAt: reg.checkedInAt || null,
        checkinSource: reg.checkinSource || null,
        checkinSourceLabel: this.sourceLabel(reg.checkinSource),
        checkedInBy: staff ? { id: staff.id, nickname: staff.nickname || '工作人员' } : null,
        paymentStatus: order?.status || '-',
        refundStatus: this.refundStatus(order, refundSum),
      }
    })

    return { items, total, page, limit }
  }
}
