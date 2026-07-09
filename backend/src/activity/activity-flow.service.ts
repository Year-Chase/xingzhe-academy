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
  ) {}

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

    // ── V2.5A: Validate requiredUserInfoFields ──
    let requiredFields: string[] = []
    try { const v = JSON.parse(activity.requiredUserInfoFields || 'null'); requiredFields = Array.isArray(v) ? v : [] } catch {}

    if (requiredFields.length > 0) {
      const info = registrationInfo || {}
      const missing: string[] = []
      for (const field of requiredFields) {
        if (!(info as any)[field]) missing.push(field)
      }
      if (missing.length > 0) {
        throw new BadRequestException(`缺少必填报名信息: ${missing.join(', ')}`)
      }
    }

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

    // ── V2.5A: Save ActivityRegistrationInfo ──
    if (registrationInfo) {
      const existingInfo = await this.regInfoRepo.findOne({ where: { userId, activityId } })
      if (existingInfo) {
        existingInfo.registrationId = saved.id
        if (registrationInfo.realName !== undefined) existingInfo.realName = registrationInfo.realName || null
        if (registrationInfo.phone !== undefined) existingInfo.phone = registrationInfo.phone || null
        if (registrationInfo.idCardNo !== undefined) existingInfo.idCardNo = registrationInfo.idCardNo || null
        if (registrationInfo.departureCity !== undefined) existingInfo.departureCity = registrationInfo.departureCity || null
        if (registrationInfo.transportPreference !== undefined) existingInfo.transportPreference = registrationInfo.transportPreference || null
        if (registrationInfo.roomPreference !== undefined) existingInfo.roomPreference = registrationInfo.roomPreference || null
        existingInfo.confirmedAt = new Date()
        await this.regInfoRepo.save(existingInfo)
      } else {
        await this.regInfoRepo.save(this.regInfoRepo.create({
          id: `reginfo_${randomUUID()}`,
          activityId,
          registrationId: saved.id,
          userId,
          realName: registrationInfo.realName || null,
          phone: registrationInfo.phone || null,
          idCardNo: registrationInfo.idCardNo || null,
          departureCity: registrationInfo.departureCity || null,
          transportPreference: registrationInfo.transportPreference || null,
          roomPreference: registrationInfo.roomPreference || null,
          confirmedAt: new Date(),
        }))
      }
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
  async getOrders(page: number, limit: number, filters?: { activityId?: number; userId?: string; status?: string; startDate?: string; endDate?: string }) {
    const qb = this.orderRepo.createQueryBuilder('o').orderBy('o.createdAt', 'DESC')
    if (filters?.activityId) qb.andWhere('o.activityId = :aid', { aid: filters.activityId })
    if (filters?.userId) qb.andWhere('o.userId = :uid', { uid: filters.userId })
    // Default: exclude PENDING unless explicitly requested
    if (filters?.status) { qb.andWhere('o.status = :st', { st: filters.status }) }
    else { qb.andWhere('o.status != :pend', { pend: 'PENDING' }) }
    if (filters?.startDate) qb.andWhere('o.createdAt >= :sd', { sd: filters.startDate })
    if (filters?.endDate) qb.andWhere('o.createdAt <= :ed', { ed: filters.endDate })
    qb.skip((page - 1) * limit).take(limit)
    const [items, total] = await qb.getManyAndCount()

    // Light join: fetch User nicknames and Activity titles post-query
    const userIds = [...new Set(items.map(o => o.userId).filter(Boolean))] as string[]
    const activityIds = [...new Set(items.filter(o => o.activityId != null).map(o => o.activityId))] as number[]
    const users = userIds.length > 0 ? await this.userRepo.find({ where: userIds.map(id => ({ id } as any)) }) : []
    const activities = activityIds.length > 0 ? await this.activityRepo.find({ where: activityIds.map(id => ({ id } as any)) }) : []
    const userMap = new Map<string, any>()
    const activityMap = new Map<number, any>()
    for (const u of users) { userMap.set(u.id, u) }
    for (const a of activities) { activityMap.set(a.id, a) }

    const enriched = items.map(o => ({
      id: o.id, registrationId: o.registrationId, userId: o.userId,
      userNickname: (userMap.get(o.userId || '') as any)?.nickname || o.userId || '',
      activityId: o.activityId,
      activityTitle: o.activityId != null ? (activityMap.get(o.activityId) as any)?.title || '' : '',
      amount: o.amount, refundedAmount: o.refundedAmount, status: o.status,
      payType: o.payType, createdAt: o.createdAt, paidAt: o.paidAt, refundedAt: o.refundedAt,
    }))

    return { items: enriched, total }
  }

  // ──── Admin: refund ────
  async refund(orderId: number, amount: number, reason: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } })
    if (!order) throw new NotFoundException(`Order ${orderId} not found`)
    if (order.status !== 'PAID' && order.status !== 'PARTIAL_REFUND')
      throw new BadRequestException('Only PAID or PARTIAL_REFUND orders can be refunded')
    if (!amount || amount <= 0) throw new BadRequestException('amount must be > 0')
    const remaining = (order.amount ?? 0) - (order.refundedAmount ?? 0)
    if (amount > remaining) throw new BadRequestException(`Refund amount ${amount} exceeds remaining ${remaining}`)

    const refund = this.refundRepo.create({
      orderId, userId: order.userId, activityId: order.activityId,
      amount, reason: reason || null, status: 'SUCCESS',
    })
    await this.refundRepo.save(refund)

    order.refundedAmount = (order.refundedAmount ?? 0) + amount
    order.refundCount = (order.refundCount ?? 0) + 1
    if (order.refundedAmount >= (order.amount ?? 0)) {
      order.status = 'REFUNDED'; order.refundedAt = new Date()
    } else {
      order.status = 'PARTIAL_REFUND'
    }
    await this.orderRepo.save(order)
    return { id: order.id, status: order.status, refundedAmount: order.refundedAmount, refundId: refund.id }
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
    const invAmount = (order.amount ?? 0) - (order.refundedAmount ?? 0)
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
