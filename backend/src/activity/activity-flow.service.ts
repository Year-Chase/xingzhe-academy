import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { randomUUID } from 'crypto'
import { Activity } from './entities/activity.entity'
import { ActivityRegistration } from './entities/activity-registration.entity'
import { ActivityOrder } from './entities/activity-order.entity'
import { ActivityQR } from './entities/activity-qr.entity'
import { ActivityRefund } from './entities/activity-refund.entity'
import { ActivityInvoice, InvoiceStatus } from './entities/activity-invoice.entity'
import { ActivityRegistrationInfo } from './entities/activity-registration-info.entity'
import { User } from '../users/entities/user.entity'
import { UserRegistrationProfile } from '../users/entities/user-registration-profile.entity'

type RegistrationInfoField = 'realName' | 'phone' | 'idCardNo' | 'departureCity' | 'transportPreference' | 'roomPreference'

const REGISTRATION_INFO_FIELDS: RegistrationInfoField[] = ['realName', 'phone', 'idCardNo', 'departureCity', 'transportPreference', 'roomPreference']
const REGISTRATION_INFO_LABELS: Record<RegistrationInfoField, string> = {
  realName: '真实姓名',
  phone: '手机号',
  idCardNo: '身份证号',
  departureCity: '出发城市',
  transportPreference: '交通工具偏好',
  roomPreference: '房间偏好',
}
const TRANSPORT_OPTIONS = ['高铁', '飞机', '自驾', '其他']
const ROOM_OPTIONS = ['单住', '拼房', '无所谓', '其他']
const PHONE_RE = /^1\d{10}$/
const ID_CARD_RE = /^(?:\d{15}|\d{17}[\dXx])$/

@Injectable()
export class ActivityFlowService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(ActivityRegistration)
    private readonly regRepo: Repository<ActivityRegistration>,
    @InjectRepository(ActivityOrder)
    private readonly orderRepo: Repository<ActivityOrder>,
    @InjectRepository(ActivityQR)
    private readonly qrRepo: Repository<ActivityQR>,
    @InjectRepository(ActivityRefund)
    private readonly refundRepo: Repository<ActivityRefund>,
    @InjectRepository(ActivityInvoice)
    private readonly invoiceRepo: Repository<ActivityInvoice>,
    @InjectRepository(ActivityRegistrationInfo)
    private readonly regInfoRepo: Repository<ActivityRegistrationInfo>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserRegistrationProfile)
    private readonly registrationProfileRepo: Repository<UserRegistrationProfile>,
  ) {}

  private money(value: unknown): number {
    const n = Number(value ?? 0)
    return Number.isFinite(n) ? n : 0
  }

  private maskPhone(phone?: string | null): string | null {
    if (!phone) return null
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  }

  private paidAmount(order: ActivityOrder): number {
    if (order.payType === 'PREPAY') {
      const prepay = this.money(order.orderPrepayAmount ?? order.amount)
      const postpay = order.postpayStatus === 'PAID' ? this.money(order.orderPostpayAmount) : 0
      return prepay + postpay
    }
    return this.money(order.amount)
  }

  private orderStatus(order: ActivityOrder, refundedAmount = this.money(order.refundedAmount)): ActivityOrder['status'] {
    const paidAmount = this.paidAmount(order)
    if (paidAmount > 0 && refundedAmount >= paidAmount) return 'REFUNDED'
    if (refundedAmount > 0) return 'PARTIAL_REFUND'
    return order.status
  }

  private refundableAmount(order: ActivityOrder, refundedAmount = this.money(order.refundedAmount)): number {
    return Math.max(0, this.paidAmount(order) - refundedAmount)
  }

  private async successfulRefundTotal(orderId: number): Promise<number> {
    const refunds = await this.refundRepo.find({ where: { orderId, status: 'SUCCESS' } })
    return refunds.reduce((sum, refund) => sum + this.money(refund.amount), 0)
  }

  private async syncPendingInvoicesAfterRefund(order: ActivityOrder, refundedAmount: number) {
    const remaining = this.refundableAmount(order, refundedAmount)
    const invoices = await this.invoiceRepo.find({ where: { orderId: order.id } })
    const pendingInvoices = invoices.filter((invoice) => invoice.status === 'REQUESTED')
    for (const invoice of pendingInvoices) {
      if (remaining <= 0) {
        invoice.amount = 0
        invoice.status = 'REFUNDED'
      } else {
        invoice.amount = remaining
      }
    }
    if (pendingInvoices.length > 0) await this.invoiceRepo.save(pendingInvoices)
  }

  private postpayDueAt(order: ActivityOrder, activity: Activity | null): string | null {
    let snapshotDue: string | null = null
    try {
      const snapshot = order.pricingSnapshot ? JSON.parse(order.pricingSnapshot) : null
      snapshotDue = typeof snapshot?.postpayDateAtOrder === 'string' ? snapshot.postpayDateAtOrder : null
    } catch {}
    const raw = snapshotDue || activity?.postpayDate || null
    if (!raw) return null
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw}T15:59:59.000Z`
    const date = new Date(raw)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }

  private timelineItem(type: string, time: Date | string | null | undefined, label: string) {
    if (!time) return null
    const date = new Date(time)
    if (Number.isNaN(date.getTime())) return null
    return { type, time: date.toISOString(), label }
  }

  private parseRequiredUserInfoFields(raw: string | null): RegistrationInfoField[] {
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed.filter((field): field is RegistrationInfoField => REGISTRATION_INFO_FIELDS.includes(field))
    } catch {
      return []
    }
  }

  private sanitizeRegistrationInfo(requiredFields: RegistrationInfoField[], input?: Record<string, unknown>): Partial<Record<RegistrationInfoField, string>> {
    const body = input || {}
    const clean: Partial<Record<RegistrationInfoField, string>> = {}
    const missing: string[] = []

    for (const field of requiredFields) {
      let value = String(body[field] ?? '').trim()
      if (field === 'idCardNo') value = value.replace(/x$/, 'X')
      if (!value) {
        missing.push(REGISTRATION_INFO_LABELS[field])
        continue
      }

      if (field === 'realName' && (value.length < 2 || value.length > 20)) throw new BadRequestException('请填写真实姓名')
      if (field === 'phone' && !PHONE_RE.test(value)) throw new BadRequestException('请填写正确的手机号')
      if (field === 'idCardNo' && !ID_CARD_RE.test(value)) throw new BadRequestException('请填写正确的身份证号')
      if (field === 'departureCity' && value.length > 30) throw new BadRequestException('出发城市最多30字')
      if (field === 'transportPreference' && !TRANSPORT_OPTIONS.includes(value)) throw new BadRequestException('请选择正确的交通工具偏好')
      if (field === 'roomPreference' && !ROOM_OPTIONS.includes(value)) throw new BadRequestException('请选择正确的房间偏好')

      clean[field] = value
    }

    if (missing.length > 0) {
      throw new BadRequestException(`缺少必填报名信息: ${missing.join(', ')}`)
    }

    return clean
  }

  private async mergeUserRegistrationProfile(userId: string, fields: RegistrationInfoField[], info: Partial<Record<RegistrationInfoField, string>>) {
    if (fields.length === 0) return
    let profile = await this.registrationProfileRepo.findOne({ where: { userId } })
    if (!profile) profile = this.registrationProfileRepo.create({ userId })
    for (const field of fields) {
      if (info[field] !== undefined) {
        ;(profile as any)[field] = info[field] || null
      }
    }
    await this.registrationProfileRepo.save(profile)
  }

  // ──── register ────
  async register(userId: string, activityId: number) {
    await this.ensureActivity(activityId)

    const existing = await this.regRepo.findOne({ where: { userId, activityId } })
    if (existing) {
      return { status: existing.status, id: existing.id }
    }

    const reg = this.regRepo.create({ userId, activityId, status: 'REGISTERED' })
    const saved = await this.regRepo.save(reg)

    const order = this.orderRepo.create({ userId, activityId, registrationId: saved.id, amount: 0, status: 'PENDING' })
    await this.orderRepo.save(order)

    return { status: 'REGISTERED', id: saved.id }
  }

  // ──── pay (legacy) ────
  async pay(userId: string, activityId: number) {
    const reg = await this.findReg(userId, activityId)
    if (reg.status !== 'REGISTERED') throw new BadRequestException(`Cannot pay: status is ${reg.status}, expected REGISTERED`)
    reg.status = 'PAID'
    await this.regRepo.save(reg)
    await this.orderRepo.update({ registrationId: reg.id }, { status: 'PAID', paidAt: new Date() })
    return { status: 'PAID', id: reg.id }
  }

  // ──── generateQR ────
  async generateQR(userId: string, activityId: number) {
    const reg = await this.findReg(userId, activityId)
    if (reg.status !== 'PAID') throw new BadRequestException(`Cannot generate QR: status is ${reg.status}, expected PAID`)
    const existing = await this.qrRepo.findOne({ where: { registrationId: reg.id } })
    if (existing && existing.status === 'ACTIVE') {
      if (existing.expiresAt && new Date() > existing.expiresAt) {
        existing.status = 'EXPIRED'
        await this.qrRepo.save(existing)
      } else {
        return { code: existing.code, status: 'ACTIVE' }
      }
    }
    const qr = this.qrRepo.create({ registrationId: reg.id, code: randomUUID(), status: 'ACTIVE', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) })
    const saved = await this.qrRepo.save(qr)
    return { code: saved.code, status: 'ACTIVE' }
  }

  // ──── getQR ────
  async getQR(userId: string, activityId: number) {
    const reg = await this.findReg(userId, activityId)
    const qr = await this.qrRepo.findOne({ where: { registrationId: reg.id, status: 'ACTIVE' as any } })
    if (!qr) throw new NotFoundException('No active QR found')
    if (qr.expiresAt && new Date() > qr.expiresAt) {
      qr.status = 'EXPIRED'
      await this.qrRepo.save(qr)
      throw new BadRequestException('QR has expired')
    }
    return { code: qr.code, status: 'ACTIVE', expiresAt: qr.expiresAt }
  }

  // ──── checkin ────
  async checkin(code: string) {
    const qr = await this.qrRepo.findOne({ where: { code, status: 'ACTIVE' as any }, relations: ['registration'] })
    if (!qr) throw new NotFoundException('QR code not found or already used')
    if (qr.expiresAt && new Date() > qr.expiresAt) {
      qr.status = 'EXPIRED'
      await this.qrRepo.save(qr)
      throw new BadRequestException('QR has expired')
    }
    qr.status = 'USED'
    await this.qrRepo.save(qr)
    const reg = await this.regRepo.findOne({ where: { id: qr.registrationId } })
    if (reg) {
      reg.status = 'CHECKED_IN'
      await this.regRepo.save(reg)
    }
    return { status: 'CHECKED_IN', registrationId: qr.registrationId, userId: reg?.userId, activityId: reg?.activityId }
  }

  // ──── checkinForActivity (Admin): validate activityId BEFORE modifying state ────
  async checkinForActivity(activityId: number, code: string) {
    // Step 1: look up the QR code — read-only, no state change
    const qr = await this.qrRepo.findOne({ where: { code }, relations: ['registration'] })
    if (!qr) throw new NotFoundException('无效二维码，核销码不存在')
    if (qr.registration?.activityId !== activityId) {
      throw new BadRequestException('该核销码不属于当前活动')
    }

    // Step 2: check QR status — already used?
    if (qr.status !== 'ACTIVE') {
      if (qr.status === 'USED') throw new BadRequestException('该核销码已签到，请勿重复核销')
      throw new BadRequestException('该核销码已失效')
    }

    // Step 3: check expiration
    if (qr.expiresAt && new Date() > qr.expiresAt) {
      qr.status = 'EXPIRED'
      await this.qrRepo.save(qr)
      throw new BadRequestException('核销码已过期')
    }

    // Step 4: only now, after all validations pass — execute the actual checkin
    qr.status = 'USED'
    await this.qrRepo.save(qr)

    const reg = await this.regRepo.findOne({ where: { id: qr.registrationId } })
    if (reg) {
      reg.status = 'CHECKED_IN'
      await this.regRepo.save(reg)
    }

    return { status: 'CHECKED_IN', registrationId: qr.registrationId, userId: reg?.userId, activityId: reg?.activityId }
  }

  // ──── getUserStatus ────
  async getUserStatus(userId: string, activityId: number) {
    const reg = await this.regRepo.findOne({ where: { userId, activityId }, relations: ['qr'] })
    if (!reg) return { status: 'NOT_REGISTERED' }
    if (reg.qr?.status === 'ACTIVE' && reg.qr?.expiresAt && new Date() > reg.qr.expiresAt) {
      reg.qr.status = 'EXPIRED'
      await this.qrRepo.save(reg.qr)
      reg.status = 'EXPIRED'
      await this.regRepo.save(reg)
    }
    return { status: reg.status, qrCode: reg.qr?.code || null, qrStatus: reg.qr?.status || null }
  }

  // ──── enrollPay ────
  async enrollPay(userId: string, activityId: number, registrationInfo?: {
    realName?: string; phone?: string; idCardNo?: string
    departureCity?: string; transportPreference?: string; roomPreference?: string
  }) {
    const activity = await this.activityRepo.findOne({ where: { id: activityId } })
    if (!activity) throw new NotFoundException(`Activity ${activityId} not found`)
    const now = new Date()

    if (activity.status !== 'PUBLISHED') throw new BadRequestException('活动未发布，暂不可报名')
    if (activity.endTime && now > new Date(activity.endTime)) throw new BadRequestException('活动已结束，不可报名')
    if (activity.registrationStartTime && now < new Date(activity.registrationStartTime)) throw new BadRequestException('报名尚未开始')
    if (activity.registrationEndTime && now > new Date(activity.registrationEndTime)) throw new BadRequestException('报名已结束')

    const paidCount = await this.regRepo.count({ where: { activityId, status: In(['PAID', 'CHECKED_IN']) } })
    if (activity.capacity > 0 && paidCount >= activity.capacity) throw new BadRequestException('活动名额已满')

    // ── V2.8.3: Validate only the activity-configured standard fields ──
    const requiredFields = this.parseRequiredUserInfoFields(activity.requiredUserInfoFields)
    const cleanRegistrationInfo = this.sanitizeRegistrationInfo(requiredFields, registrationInfo as any)

    const existing = await this.regRepo.findOne({ where: { userId, activityId } })
    if (existing && (existing.status === 'PAID' || existing.status === 'CHECKED_IN')) {
      const qr = await this.qrRepo.findOne({ where: { registrationId: existing.id, status: 'ACTIVE' as any } })
      return { status: existing.status, id: existing.id, code: qr?.code || null }
    }

    let reg = existing
    if (!reg) { reg = this.regRepo.create({ userId, activityId, status: 'PAID' }) }
    else { reg.status = 'PAID' }
    const saved = await this.regRepo.save(reg)

    // ── V2.8-C: Compute price based on user identityType and activity pricingRules ──
    const orderExists = await this.orderRepo.findOne({ where: { registrationId: saved.id } })
    const user = await this.userRepo.findOne({ where: { id: userId as any } })
    const userType = user?.identityType || '普通用户'
    const { amount, snapshot } = this.resolvePrice(activity, userType)

    const orderData: any = {
      amount, status: 'PAID' as const, paidAt: new Date(),
      payType: (activity.paymentMode as any) || 'FULL',
      userTypeAtOrder: userType,
      priceSource: snapshot.priceSource,
      fullAmount: snapshot.fullAmount,
      orderPrepayAmount: snapshot.orderPrepayAmount,
      orderPostpayAmount: snapshot.orderPostpayAmount,
      pricingSnapshot: snapshot.pricingSnapshot,
      // V2.8-D: Initialize postpay status
      postpayStatus: (activity.paymentMode === 'PREPAY' && snapshot.orderPostpayAmount > 0) ? 'UNPAID' : 'NONE',
    }

    if (!orderExists) {
      await this.orderRepo.save(this.orderRepo.create({ userId, activityId, registrationId: saved.id, ...orderData }))
    } else {
      await this.orderRepo.update({ registrationId: saved.id }, orderData)
    }

    let qr = await this.qrRepo.findOne({ where: { registrationId: saved.id, status: 'ACTIVE' as any } })
    if (!qr) {
      qr = this.qrRepo.create({ registrationId: saved.id, code: randomUUID(), status: 'ACTIVE', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) })
      await this.qrRepo.save(qr)
    }

    // ── V2.8.3: Save per-registration snapshot + merge reusable profile ──
    if (requiredFields.length > 0) {
      const existingInfo = await this.regInfoRepo.findOne({ where: { userId, activityId } })
      if (existingInfo) {
        existingInfo.registrationId = saved.id
        existingInfo.realName = cleanRegistrationInfo.realName || null
        existingInfo.phone = cleanRegistrationInfo.phone || null
        existingInfo.idCardNo = cleanRegistrationInfo.idCardNo || null
        existingInfo.departureCity = cleanRegistrationInfo.departureCity || null
        existingInfo.transportPreference = cleanRegistrationInfo.transportPreference || null
        existingInfo.roomPreference = cleanRegistrationInfo.roomPreference || null
        existingInfo.confirmedAt = new Date()
        await this.regInfoRepo.save(existingInfo)
      } else {
        await this.regInfoRepo.save(this.regInfoRepo.create({
          id: `reginfo_${randomUUID()}`,
          activityId,
          registrationId: saved.id,
          userId,
          realName: cleanRegistrationInfo.realName || null,
          phone: cleanRegistrationInfo.phone || null,
          idCardNo: cleanRegistrationInfo.idCardNo || null,
          departureCity: cleanRegistrationInfo.departureCity || null,
          transportPreference: cleanRegistrationInfo.transportPreference || null,
          roomPreference: cleanRegistrationInfo.roomPreference || null,
          confirmedAt: new Date(),
        }))
      }
      await this.mergeUserRegistrationProfile(userId, requiredFields, cleanRegistrationInfo)
    }

    return { status: 'PAID', id: saved.id, code: qr.code, orderId: orderExists?.id || null, amount }
  }

  // ──── V2.8-C: Resolve price from pricingRules or legacy fields ────
  private resolvePrice(activity: Activity, userType: string): { amount: number; snapshot: {
    priceSource: string; fullAmount: number; orderPrepayAmount: number; orderPostpayAmount: number; pricingSnapshot: string | null
  } } {
    const USER_TYPES = ['普通用户', '会员', '终身会员', '志愿者', '工作人员']
    const payMode = activity.paymentMode || 'FULL'

    // Try pricingRules
    let rules: any[] = []
    try { const v = JSON.parse(activity.pricingRules || 'null'); rules = Array.isArray(v) ? v : [] } catch {}
    const normalRule = rules.find((r: any) => r.userType === '普通用户' && r.enabled !== false)

    if (rules.length > 0) {
      let matched = rules.find((r: any) => r.userType === userType && r.enabled !== false)
      if (!matched) matched = normalRule
      if (!matched) matched = { fullAmount: 0, prepayAmount: 0, postpayAmount: 0 }

      const fullAmount = Number(matched.fullAmount || 0)
      const prepayAmount = Number(matched.prepayAmount || 0)
      const postpayAmount = Number(matched.postpayAmount || 0)
      const amount = payMode === 'PREPAY' ? prepayAmount : fullAmount
      const snapshotObj = { ...matched, postpayDateAtOrder: activity.postpayDate || null }

      return {
        amount,
        snapshot: {
          priceSource: 'pricingRules',
          fullAmount,
          orderPrepayAmount: prepayAmount,
          orderPostpayAmount: postpayAmount,
          pricingSnapshot: JSON.stringify(snapshotObj),
        },
      }
    }

    // Legacy fallback
    const price = activity.price ?? 0
    const memberPrice = activity.memberPrice ?? 0
    const lifetimeMemberPrice = activity.lifetimeMemberPrice ?? 0
    const prepayAmount = activity.prepayAmount ?? 0
    const remainingAmount = activity.remainingAmount ?? 0

    let fullAmount = price
    if (userType === '会员' && memberPrice > 0) fullAmount = memberPrice
    else if (userType === '终身会员') {
      if (lifetimeMemberPrice > 0) fullAmount = lifetimeMemberPrice
      else if (memberPrice > 0) fullAmount = memberPrice
    }
    // 志愿者 / 工作人员 / 普通用户 / 未设置 → price

    const legacyPrepay = prepayAmount
    const legacyPostpay = Math.max(0, fullAmount - legacyPrepay)
    const amount = payMode === 'PREPAY' ? legacyPrepay : fullAmount

    return {
      amount,
      snapshot: {
        priceSource: 'legacy',
        fullAmount,
        orderPrepayAmount: legacyPrepay,
        orderPostpayAmount: legacyPostpay,
        pricingSnapshot: JSON.stringify({ userType, fullAmount, prepayAmount: legacyPrepay, postpayAmount: legacyPostpay, postpayDateAtOrder: activity.postpayDate || null }),
      },
    }
  }

  // ──── getRegisteredCount — from Registration (single source of truth) ────
  async getRegisteredCount(activityId: number): Promise<number> {
    return this.regRepo.count({ where: { activityId, status: In(['PAID', 'CHECKED_IN']) } })
  }

  // ──── getParticipants ────
  async getParticipants(activityId: number, _currentUserId: string) {
    const regs = await this.regRepo.find({ where: { activityId, status: In(['PAID', 'CHECKED_IN']) } })
    const userIds = [...new Set(regs.map(r => r.userId).filter(Boolean))] as string[]
    const users = userIds.length > 0 ? await this.userRepo.find({ where: userIds.map(id => ({ id } as any)) }) : []
    const userMap = new Map<string, User>()
    for (const u of users) { userMap.set(u.id, u) }
    return regs.map((r) => {
      const u = userMap.get(r.userId)
      return {
        userId: r.userId,
        avatarUrl: u?.avatarUrl || '',
        nickname: u?.nickname || '行者',
        name: u?.nickname || '行者',
        gender: u?.gender || '未知',
        commonActivityCount: 0,
        motto: u?.intro || '',
        status: r.status,
      }
    })
  }

  // ──── Admin: getOrders ────
  async getOrders(page: number, limit: number, filters?: {
    activityId?: number
    userId?: string
    keyword?: string
    activityTitle?: string
    status?: string
    startDate?: string
    endDate?: string
    paymentMode?: string
    postpayStatus?: string
  }) {
    const qb = this.orderRepo.createQueryBuilder('o').orderBy('o.createdAt', 'DESC').addOrderBy('o.id', 'DESC')
    if (filters?.activityId) qb.andWhere('o.activityId = :aid', { aid: filters.activityId })
    if (filters?.userId) qb.andWhere('o.userId = :uid', { uid: filters.userId })
    if (filters?.paymentMode) qb.andWhere('o.payType = :payType', { payType: filters.paymentMode })
    if (filters?.postpayStatus) qb.andWhere('o.postpayStatus = :postpayStatus', { postpayStatus: filters.postpayStatus })
    if (filters?.status && !['PAID', 'PARTIAL_REFUND', 'REFUNDED'].includes(filters.status)) {
      qb.andWhere('o.status = :st', { st: filters.status })
    }
    if (filters?.startDate) qb.andWhere('o.createdAt >= :sd', { sd: filters.startDate })
    if (filters?.endDate) qb.andWhere('o.createdAt <= :ed', { ed: filters.endDate })
    const orders = await qb.getMany()

    // Light join: fetch User nicknames and Activity titles post-query
    const userIds = [...new Set(orders.map(o => o.userId).filter(Boolean))] as string[]
    const activityIds = [...new Set(orders.filter(o => o.activityId != null).map(o => o.activityId))] as number[]
    const users = userIds.length > 0 ? await this.userRepo.find({ where: userIds.map(id => ({ id } as any)) }) : []
    const activities = activityIds.length > 0 ? await this.activityRepo.find({ where: activityIds.map(id => ({ id } as any)) }) : []
    const orderIds = orders.map(o => o.id)
    const invoices = orderIds.length > 0 ? await this.invoiceRepo.find({ where: { orderId: In(orderIds) } }) : []
    const refunds = orderIds.length > 0 ? await this.refundRepo.find({ where: { orderId: In(orderIds), status: 'SUCCESS' } }) : []
    const userMap = new Map<string, any>()
    const activityMap = new Map<number, any>()
    const invoiceMap = new Map<number, ActivityInvoice[]>()
    const refundMap = new Map<number, number>()
    for (const u of users) { userMap.set(u.id, u) }
    for (const a of activities) { activityMap.set(a.id, a) }
    for (const invoice of invoices) {
      const existing = invoiceMap.get(invoice.orderId) || []
      existing.push(invoice)
      invoiceMap.set(invoice.orderId, existing)
    }
    for (const refund of refunds) {
      refundMap.set(refund.orderId, (refundMap.get(refund.orderId) || 0) + this.money(refund.amount))
    }

    const keyword = filters?.keyword?.trim().toLowerCase()
    const activityTitle = filters?.activityTitle?.trim().toLowerCase()
    const enriched = orders.map(o => {
      const user = userMap.get(o.userId || '') as any
      const activity = o.activityId != null ? (activityMap.get(o.activityId) as any) : null
      const relatedInvoices = invoiceMap.get(o.id) || []
      const refundedAmount = refundMap.has(o.id) ? refundMap.get(o.id)! : this.money(o.refundedAmount)
      const paidAmount = this.paidAmount(o)
      const derivedStatus = this.orderStatus(o, refundedAmount)
      return {
        id: o.id, registrationId: o.registrationId, userId: o.userId,
        userNickname: user?.nickname || o.userId || '',
        searchPhone: user?.phone || '',
        activityId: o.activityId,
        activityTitle: activity?.title || '',
        amount: this.money(o.amount),
        paidAmount,
        refundableAmount: this.refundableAmount(o, refundedAmount),
        refundedAmount,
        status: derivedStatus,
        rawStatus: o.status,
        payType: o.payType,
        postpayStatus: o.postpayStatus,
        orderPrepayAmount: this.money(o.orderPrepayAmount),
        orderPostpayAmount: this.money(o.orderPostpayAmount),
        createdAt: o.createdAt,
        paidAt: o.paidAt,
        refundedAt: o.refundedAt,
        hasIssuedInvoice: relatedInvoices.some((invoice) => invoice.status === 'ISSUED'),
        invoiceStatus: relatedInvoices[0]?.status || null,
      }
    }).filter((o) => {
      if (keyword) {
        const haystack = `${o.userId || ''} ${o.userNickname || ''} ${o.searchPhone || ''}`.toLowerCase()
        if (!haystack.includes(keyword)) return false
      }
      if (activityTitle && !(o.activityTitle || '').toLowerCase().includes(activityTitle)) return false
      if (filters?.status && ['PAID', 'PARTIAL_REFUND', 'REFUNDED'].includes(filters.status) && o.status !== filters.status) return false
      return true
    })
    const total = enriched.length
    const items = enriched.slice((page - 1) * limit, page * limit).map(({ searchPhone, ...item }) => item)

    return { items, total }
  }

  async getOrderDetail(orderId: number) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } })
    if (!order) throw new NotFoundException(`Order ${orderId} not found`)

    const [activity, user, registration, registrationInfo, refunds, invoices] = await Promise.all([
      order.activityId != null ? this.activityRepo.findOne({ where: { id: order.activityId } }) : Promise.resolve(null),
      order.userId ? this.userRepo.findOne({ where: { id: order.userId as any } }) : Promise.resolve(null),
      this.regRepo.findOne({ where: { id: order.registrationId } }),
      this.regInfoRepo.findOne({ where: { registrationId: order.registrationId } }),
      this.refundRepo.find({ where: { orderId }, order: { createdAt: 'DESC' } }),
      this.invoiceRepo.find({ where: { orderId }, order: { createdAt: 'DESC' } }),
    ])

    const successfulRefundedAmount = refunds
      .filter((refund) => refund.status === 'SUCCESS')
      .reduce((sum, refund) => sum + this.money(refund.amount), 0)
    const paidAmount = this.paidAmount(order)
    const derivedStatus = this.orderStatus(order, successfulRefundedAmount)
    const phoneMasked = this.maskPhone(registrationInfo?.phone || user?.phone || null)

    const timeline = [
      this.timelineItem('ORDER_CREATED', order.createdAt, '订单创建'),
      this.timelineItem('ORDER_PAID', order.paidAt, '订单支付'),
      this.timelineItem('POSTPAY_PAID', order.postpayPaidAt, '后付款完成'),
      order.postpayReminderCount > 0 ? this.timelineItem('POSTPAY_REMINDER_RECORDED', order.lastPostpayReminderAt, '最后一次提醒记录') : null,
      this.timelineItem('POSTPAY_WAIVED', order.postpayWaivedAt, '后付款免除'),
      ...refunds.map((refund) => this.timelineItem('REFUND_RECORDED', refund.createdAt, `退款登记 ¥${this.money(refund.amount).toFixed(2)}`)),
      ...invoices.map((invoice) => this.timelineItem('INVOICE_REQUESTED', invoice.createdAt, '发票申请')),
      ...invoices.map((invoice) => this.timelineItem('INVOICE_ISSUED', invoice.issuedAt, '发票已开具')),
    ]
      .filter((item): item is { type: string; time: string; label: string } => !!item)
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

    return {
      id: order.id,
      status: derivedStatus,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      payType: order.payType,
      activity: activity ? {
        id: activity.id,
        title: activity.title,
        startTime: activity.startTime || null,
        endTime: activity.endTime || null,
        locationName: activity.locationName || activity.location || null,
        locationAddress: activity.locationAddress || null,
      } : null,
      user: {
        id: order.userId || registration?.userId || null,
        nickname: user?.nickname || null,
        avatarUrl: user?.avatarUrl || null,
        phoneMasked,
        identityType: user?.identityType || null,
        userTypeAtOrder: order.userTypeAtOrder || null,
      },
      money: {
        priceSource: order.priceSource || null,
        fullAmount: this.money(order.fullAmount ?? order.amount),
        orderAmount: this.money(order.amount),
        prepayAmount: this.money(order.orderPrepayAmount),
        postpayAmount: this.money(order.orderPostpayAmount),
        paidAmount,
        refundedAmount: successfulRefundedAmount,
        refundableAmount: this.refundableAmount(order, successfulRefundedAmount),
      },
      postpay: {
        dueAt: this.postpayDueAt(order, activity),
        status: order.postpayStatus || 'NONE',
        paidAt: order.postpayPaidAt || null,
        reminderCount: Number(order.postpayReminderCount || 0),
        lastReminderAt: order.lastPostpayReminderAt || null,
        waivedAt: order.postpayWaivedAt || null,
        waiveReason: order.postpayWaiveReason || null,
      },
      refunds: refunds.map((refund) => ({
        id: refund.id,
        amount: this.money(refund.amount),
        reason: refund.reason || null,
        status: refund.status,
        createdAt: refund.createdAt,
      })),
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        title: invoice.title,
        amount: this.money(invoice.amount),
        status: invoice.status,
        createdAt: invoice.createdAt,
        issuedAt: invoice.issuedAt || null,
      })),
      timeline,
    }
  }

  // ──── Admin: refund ────
  async refund(orderId: number, amount: number, reason: string) {
    const cleanReason = (reason || '').trim()
    if (!cleanReason) throw new BadRequestException('退款原因不能为空')
    const order = await this.orderRepo.findOne({ where: { id: orderId } })
    if (!order) throw new NotFoundException(`Order ${orderId} not found`)
    if (order.status !== 'PAID' && order.status !== 'PARTIAL_REFUND')
      throw new BadRequestException('Only PAID or PARTIAL_REFUND orders can be refunded')
    const refundAmount = this.money(amount)
    if (!refundAmount || refundAmount <= 0) throw new BadRequestException('amount must be > 0')
    const currentRefundedAmount = await this.successfulRefundTotal(orderId)
    const remaining = this.refundableAmount(order, currentRefundedAmount)
    if (refundAmount > remaining) throw new BadRequestException(`Refund amount ${refundAmount} exceeds remaining ${remaining}`)

    const refund = this.refundRepo.create({
      orderId, userId: order.userId, activityId: order.activityId,
      amount: refundAmount, reason: cleanReason, status: 'SUCCESS',
    })
    await this.refundRepo.save(refund)

    const refundedAmount = await this.successfulRefundTotal(orderId)
    order.refundedAmount = refundedAmount
    order.refundCount = (order.refundCount ?? 0) + 1
    if (refundedAmount >= this.paidAmount(order)) {
      order.status = 'REFUNDED'; order.refundedAt = new Date()
    } else {
      order.status = 'PARTIAL_REFUND'
    }
    await this.orderRepo.save(order)
    await this.syncPendingInvoicesAfterRefund(order, refundedAmount)
    return { id: order.id, status: order.status, refundedAmount, refundId: refund.id }
  }

  // ──── Admin: finance summary ────
  async financeSummary() {
    const allOrders = await this.orderRepo.find({ where: { status: In(['PAID', 'PARTIAL_REFUND', 'REFUNDED']) } })
    const totalRevenue = allOrders.reduce((s, o) => s + Number(o.amount || 0), 0) as number
    const refunds = await this.refundRepo.find({ where: { status: 'SUCCESS' } })
    const totalRefund = refunds.reduce((s, r) => s + Number(r.amount || 0), 0) as number
    const refundedOrderCount = allOrders.filter(o => o.status === 'REFUNDED').length
    const partialRefundOrderCount = allOrders.filter(o => o.status === 'PARTIAL_REFUND').length
    return {
      totalRevenue, totalRefund, netRevenue: totalRevenue - totalRefund,
      orderCount: allOrders.length, paidOrderCount: allOrders.length,
      refundedOrderCount, partialRefundOrderCount,
      refundRate: allOrders.length > 0 ? refundedOrderCount / allOrders.length : 0,
    }
  }

  async financeActivity(activityId: number) {
    const orders = await this.orderRepo.find({ where: { activityId, status: In(['PAID', 'PARTIAL_REFUND', 'REFUNDED']) } })
    const revenue = orders.reduce((s, o) => s + Number(o.amount || 0), 0) as number
    const refunds = await this.refundRepo.find({ where: { activityId, status: 'SUCCESS' } })
    const refundTotal = refunds.reduce((s, r) => s + Number(r.amount || 0), 0) as number
    return {
      activityId, activityRevenue: revenue, activityRefund: refundTotal, activityNetRevenue: revenue - refundTotal,
      orderCount: orders.length, paidOrderCount: orders.length, refundCount: refunds.length,
    }
  }

  // ──── Admin: invoices ────
  async requestInvoice(orderId: number, title: string, taxNo?: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } })
    if (!order) throw new NotFoundException(`Order ${orderId} not found`)
    if (!['PAID', 'PARTIAL_REFUND', 'REFUNDED'].includes(order.status))
      throw new BadRequestException('Only paid/refunded orders can request invoice')
    const invAmount = this.refundableAmount(order)
    if (invAmount <= 0) throw new BadRequestException('No invoice-able amount remaining')
    const inv = this.invoiceRepo.create({ orderId, userId: order.userId, activityId: order.activityId, title, taxNo: taxNo || null, invoiceType: taxNo ? 'COMPANY' : 'PERSONAL', amount: invAmount, status: 'REQUESTED' })
    return this.invoiceRepo.save(inv)
  }

  async getInvoices(page: number, limit: number, filters?: { status?: string; activityId?: number; userId?: string }) {
    const qb = this.invoiceRepo.createQueryBuilder('i').orderBy('i.createdAt', 'DESC')
    if (filters?.status) qb.andWhere('i.status = :st', { st: filters.status })
    if (filters?.activityId) qb.andWhere('i.activityId = :aid', { aid: filters.activityId })
    if (filters?.userId) qb.andWhere('i.userId = :uid', { uid: filters.userId })
    qb.skip((page - 1) * limit).take(limit)
    const [items, total] = await qb.getManyAndCount()
    const userIds = [...new Set(items.map(i => i.userId).filter(Boolean))] as string[]
    const activityIds = [...new Set(items.map(i => i.activityId).filter((id): id is number => id != null))]
    const users = userIds.length > 0 ? await this.userRepo.find({ where: userIds.map(id => ({ id } as any)) }) : []
    const activities = activityIds.length > 0 ? await this.activityRepo.find({ where: activityIds.map(id => ({ id } as any)) }) : []
    const userMap = new Map(users.map(u => [u.id, u]))
    const activityMap = new Map(activities.map(a => [a.id, a]))
    return {
      items: items.map(i => {
        const user = i.userId ? userMap.get(i.userId) : null
        const activity = i.activityId != null ? activityMap.get(i.activityId) : null
        return {
          ...i,
          amount: Number(i.amount || 0),
          invoiceType: i.invoiceType || (i.taxNo ? 'COMPANY' : 'PERSONAL'),
          invoiceTitle: i.title,
          taxNumber: i.taxNo || '',
          userNickname: user?.nickname || '',
          userPhone: user?.phone || '',
          activityTitle: activity?.title || '',
        }
      }),
      total,
    }
  }

  async getInvoiceDetail(id: number) {
    const inv = await this.invoiceRepo.findOne({ where: { id } })
    if (!inv) throw new NotFoundException(`Invoice ${id} not found`)
    const [user, activity, order] = await Promise.all([
      inv.userId ? this.userRepo.findOne({ where: { id: inv.userId } }) : Promise.resolve(null),
      inv.activityId != null ? this.activityRepo.findOne({ where: { id: inv.activityId } }) : Promise.resolve(null),
      this.orderRepo.findOne({ where: { id: inv.orderId } }),
    ])
    return {
      ...inv,
      amount: Number(inv.amount || 0),
      invoiceType: inv.invoiceType || (inv.taxNo ? 'COMPANY' : 'PERSONAL'),
      invoiceTitle: inv.title,
      taxNumber: inv.taxNo || '',
      userNickname: user?.nickname || '',
      userPhone: user?.phone || '',
      activityTitle: activity?.title || '',
      orderStatus: order?.status || null,
      payType: order?.payType || null,
    }
  }

  async issueInvoice(id: number) {
    const inv = await this.invoiceRepo.findOne({ where: { id } })
    if (!inv) throw new NotFoundException(`Invoice ${id} not found`)
    if (inv.status !== 'REQUESTED') throw new BadRequestException('Invoice already issued or canceled')
    inv.status = 'ISSUED'; inv.issuedAt = new Date()
    return this.invoiceRepo.save(inv)
  }

  // ── V2.8-D: Postpay management ──

  async getPostpaySummary(activityId: number) {
    const activity = await this.activityRepo.findOne({ where: { id: activityId } })
    if (!activity) throw new NotFoundException(`Activity ${activityId} not found`)
    const orders = await this.orderRepo.find({ where: { activityId, status: 'PAID', payType: 'PREPAY' } })
    const totalCount = orders.length
    const paidCount = orders.filter(o => o.postpayStatus === 'PAID').length
    const unpaidCount = orders.filter(o => o.postpayStatus === 'UNPAID' || o.postpayStatus === 'NONE').length
    const overdueCount = orders.filter(o => o.postpayStatus === 'OVERDUE').length
    const waivedCount = orders.filter(o => o.postpayStatus === 'WAIVED').length
    const totalPostpayAmount = orders.reduce((s, o) => s + Number(o.orderPostpayAmount || 0), 0)
    const paidPostpayAmount = orders.filter(o => o.postpayStatus === 'PAID').reduce((s, o) => s + Number(o.orderPostpayAmount || 0), 0)
    const unpaidPostpayAmount = orders.filter(o => o.postpayStatus === 'UNPAID' || o.postpayStatus === 'NONE').reduce((s, o) => s + Number(o.orderPostpayAmount || 0), 0)
    return {
      activityId, title: activity.title,
      postpayDate: activity.postpayDate || null,
      totalCount, paidCount, unpaidCount, overdueCount, waivedCount,
      totalPostpayAmount, paidPostpayAmount, unpaidPostpayAmount,
    }
  }

  async getPostpayOrders(activityId: number, filters?: { status?: string; keyword?: string; page?: number; limit?: number }) {
    const p = Math.max(1, filters?.page || 1)
    const l = Math.min(100, Math.max(1, filters?.limit || 50))
    const qb = this.orderRepo.createQueryBuilder('o')
      .where('o.activityId = :aid', { aid: activityId })
      .andWhere('o.payType = :pt', { pt: 'PREPAY' })
      .andWhere('o.status = :st', { st: 'PAID' })
      .orderBy('o.createdAt', 'ASC')

    if (filters?.status && filters.status !== 'ALL') {
      qb.andWhere('o.postpayStatus = :ps', { ps: filters.status })
    }

    qb.skip((p - 1) * l).take(l)
    const [items, total] = await qb.getManyAndCount()

    // Enrich with user info
    const userIds = [...new Set(items.map(o => o.userId).filter(Boolean))] as string[]
    const users = userIds.length > 0 ? await this.userRepo.find({ where: userIds.map(id => ({ id } as any)) }) : []
    const userMap = new Map<string, User>()
    for (const u of users) { userMap.set(u.id, u) }

    // Also get registration info for phone numbers
    const regIds = items.map(o => o.registrationId)
    const regInfos = regIds.length > 0 ? await this.regInfoRepo.find({ where: { registrationId: In(regIds) } }) : []
    const regInfoMap = new Map<number, any>()
    for (const ri of regInfos) { regInfoMap.set(ri.registrationId, ri) }

    // Keyword filter post-query (for nickname/phone matching)
    let enriched = items.map(o => {
      const u = userMap.get(o.userId || '')
      const ri = regInfoMap.get(o.registrationId)
      return {
        id: o.id, registrationId: o.registrationId, userId: o.userId,
        nickname: u?.nickname || '行者',
        phone: ri?.phone || u?.phone || null,
        phoneMasked: ri?.phone ? ri.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : (u?.phone ? u.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null),
        userType: o.userTypeAtOrder || '普通用户',
        prepayAmount: o.orderPrepayAmount,
        postpayAmount: o.orderPostpayAmount,
        postpayStatus: o.postpayStatus,
        postpayPaidAt: o.postpayPaidAt,
        postpayReminderCount: o.postpayReminderCount,
        lastPostpayReminderAt: o.lastPostpayReminderAt,
        postpayWaivedAt: o.postpayWaivedAt,
        postpayWaiveReason: o.postpayWaiveReason,
        activityId: o.activityId,
      }
    })

    if (filters?.keyword) {
      const kw = filters.keyword.toLowerCase()
      enriched = enriched.filter(e =>
        (e.nickname && e.nickname.toLowerCase().includes(kw)) ||
        (e.phone && e.phone.includes(kw))
      )
    }

    return { items: enriched, total: enriched.length, page: p, limit: l }
  }

  async mockCompletePostpay(orderId: number, userId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } })
    if (!order) throw new NotFoundException(`Order ${orderId} not found`)
    if (order.userId !== userId) throw new BadRequestException('Order does not belong to this user')
    if (order.payType !== 'PREPAY') throw new BadRequestException('Not a PREPAY order')
    if (order.postpayStatus === 'PAID') throw new BadRequestException('后付款已完成')
    if (order.postpayStatus === 'WAIVED') throw new BadRequestException('后付款已免除')

    order.postpayStatus = 'PAID'
    order.postpayPaidAt = new Date()
    await this.orderRepo.save(order)

    return {
      id: order.id,
      postpayStatus: order.postpayStatus,
      postpayPaidAt: order.postpayPaidAt,
      orderPostpayAmount: order.orderPostpayAmount,
    }
  }

  async getOrderForUser(orderId: number, userId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId, userId } })
    if (!order) throw new NotFoundException(`Order ${orderId} not found`)
    return {
      id: order.id, registrationId: order.registrationId, activityId: order.activityId,
      amount: order.amount, status: order.status, payType: order.payType,
      orderPrepayAmount: order.orderPrepayAmount, orderPostpayAmount: order.orderPostpayAmount,
      postpayStatus: order.postpayStatus,
      postpayPaidAt: order.postpayPaidAt,
      postpayReminderCount: order.postpayReminderCount,
      lastPostpayReminderAt: order.lastPostpayReminderAt,
    }
  }

  async getOrderByActivityAndUser(activityId: number, userId: string) {
    const order = await this.orderRepo.findOne({ where: { activityId, userId, status: 'PAID' } })
    if (!order) return null
    return {
      id: order.id, registrationId: order.registrationId, activityId: order.activityId,
      amount: order.amount, status: order.status, payType: order.payType,
      payMode: order.payType,
      prepayStatus: 'PAID' as const,
      postpayStatus: order.postpayStatus,
      orderPrepayAmount: order.orderPrepayAmount,
      orderPostpayAmount: order.orderPostpayAmount,
      postpayPaidAt: order.postpayPaidAt,
      postpayReminderCount: order.postpayReminderCount,
      lastPostpayReminderAt: order.lastPostpayReminderAt,
      postpayDate: (await this.activityRepo.findOne({ where: { id: activityId } }))?.postpayDate || null,
    }
  }

  async getUserPostpayOrders(userId: string) {
    const orders = await this.orderRepo.find({
      where: { userId, status: 'PAID', payType: 'PREPAY' },
      order: { createdAt: 'DESC' },
    })
    const enriched = await Promise.all(orders.map(async (o) => {
      const activity = o.activityId ? await this.activityRepo.findOne({ where: { id: o.activityId } }) : null
      return {
        activityId: o.activityId,
        title: activity?.title || '',
        location: activity?.location || '',
        startTime: activity?.startTime || null,
        endTime: activity?.endTime || null,
        coverImage: activity?.coverImage || '',
        province: activity?.province || '',
        city: activity?.city || '',
        orderId: o.id,
        paymentMode: o.payType,
        prepayStatus: 'PAID',
        postpayStatus: o.postpayStatus,
        orderPrepayAmount: o.orderPrepayAmount,
        orderPostpayAmount: o.orderPostpayAmount,
        postpayDate: activity?.postpayDate || null,
        postpayPaidAt: o.postpayPaidAt,
      }
    }))
    return enriched
  }

  // ──── Admin: postpay operations ────

  async adminMarkPostpayPaid(orderId: number) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } })
    if (!order) throw new NotFoundException(`Order ${orderId} not found`)
    if (order.payType !== 'PREPAY') throw new BadRequestException('Not a PREPAY order')
    if (order.postpayStatus === 'PAID') throw new BadRequestException('后付款已完成')
    if (order.postpayStatus === 'WAIVED') throw new BadRequestException('后付款已免除，如需标记已付请先撤销免除')

    order.postpayStatus = 'PAID'
    order.postpayPaidAt = new Date()
    await this.orderRepo.save(order)
    return { id: order.id, postpayStatus: order.postpayStatus, postpayPaidAt: order.postpayPaidAt }
  }

  async adminWaivePostpay(orderId: number, reason: string) {
    if (!reason || !reason.trim()) throw new BadRequestException('免除原因不能为空')
    const order = await this.orderRepo.findOne({ where: { id: orderId } })
    if (!order) throw new NotFoundException(`Order ${orderId} not found`)
    if (order.payType !== 'PREPAY') throw new BadRequestException('Not a PREPAY order')
    if (order.postpayStatus === 'WAIVED') throw new BadRequestException('后付款已免除')
    if (order.postpayStatus === 'PAID') throw new BadRequestException('后付款已完成，无法免除')

    order.postpayStatus = 'WAIVED'
    order.postpayWaivedAt = new Date()
    order.postpayWaiveReason = reason.trim()
    await this.orderRepo.save(order)
    return { id: order.id, postpayStatus: order.postpayStatus, postpayWaivedAt: order.postpayWaivedAt, postpayWaiveReason: order.postpayWaiveReason }
  }

  async adminSendPostpayReminder(orderId: number, activityId?: number) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } })
    if (!order) throw new NotFoundException(`Order ${orderId} not found`)
    if (order.payType !== 'PREPAY') throw new BadRequestException('Not a PREPAY order')
    if (order.postpayStatus !== 'UNPAID' && order.postpayStatus !== 'OVERDUE')
      throw new BadRequestException(`后付款状态为 ${order.postpayStatus}，无法发送提醒`)

    const activity = activityId ? await this.activityRepo.findOne({ where: { id: activityId } }) : (order.activityId ? await this.activityRepo.findOne({ where: { id: order.activityId } }) : null)
    const user = order.userId ? await this.userRepo.findOne({ where: { id: order.userId as any } }) : null

    order.postpayReminderCount = (order.postpayReminderCount || 0) + 1
    order.lastPostpayReminderAt = new Date()
    await this.orderRepo.save(order)

    const reminderText = `你报名的「${activity?.title || ''}」还有一笔后付款待完成。\n\n后付款金额：¥${order.orderPostpayAmount || 0}\n后付款日期：${activity?.postpayDate || '待确认'}\n\n你可以在「我的活动」中完成后付款。`

    return {
      id: order.id,
      postpayReminderCount: order.postpayReminderCount,
      lastPostpayReminderAt: order.lastPostpayReminderAt,
      reminderText,
      userNickname: user?.nickname || '',
    }
  }

  async adminBatchSendPostpayReminders(activityId: number) {
    const orders = await this.orderRepo.find({
      where: { activityId, status: 'PAID', payType: 'PREPAY' },
    })
    const targets = orders.filter(o => o.postpayStatus === 'UNPAID' || o.postpayStatus === 'OVERDUE')

    let sent = 0
    for (const order of targets) {
      order.postpayReminderCount = (order.postpayReminderCount || 0) + 1
      order.lastPostpayReminderAt = new Date()
      await this.orderRepo.save(order)
      sent++
    }

    const activity = await this.activityRepo.findOne({ where: { id: activityId } })
    return {
      activityId,
      activityTitle: activity?.title || '',
      targetCount: targets.length,
      sentCount: sent,
      postpayDate: activity?.postpayDate || null,
    }
  }

  // ──── private ────
  private async ensureActivity(id: number) {
    const a = await this.activityRepo.findOne({ where: { id } })
    if (!a) {
      await this.activityRepo.save(this.activityRepo.create({ id, title: `活动 #${id}`, status: 'PUBLISHED' }))
    }
  }

  private async findReg(userId: string, activityId: number) {
    const reg = await this.regRepo.findOne({ where: { userId, activityId } })
    if (!reg) throw new NotFoundException(`No registration for user ${userId} on activity ${activityId}`)
    return reg
  }
}
