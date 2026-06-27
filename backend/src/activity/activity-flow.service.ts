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

    // Create or update order — amount from activity.price, status → PAID
    const orderExists = await this.orderRepo.findOne({ where: { registrationId: saved.id } })
    const price = activity.price ?? 0
    if (!orderExists) {
      await this.orderRepo.save(this.orderRepo.create({ userId, activityId, registrationId: saved.id, amount: price, status: 'PAID', paidAt: new Date(), payType: (activity.paymentMode as any) || 'FULL' }))
    } else {
      await this.orderRepo.update({ registrationId: saved.id }, { amount: price, status: 'PAID', paidAt: new Date() })
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

    return { status: 'PAID', id: saved.id, code: qr.code, orderId: orderExists?.id || null, amount: price }
  }

  // ──── getRegisteredCount — from Registration (single source of truth) ────
  async getRegisteredCount(activityId: number): Promise<number> {
    return this.regRepo.count({ where: { activityId, status: In(['PAID', 'CHECKED_IN']) } })
  }

  // ──── getParticipants ────
  async getParticipants(activityId: number, _currentUserId: string) {
    const regs = await this.regRepo.find({ where: { activityId, status: In(['PAID', 'CHECKED_IN']) } })
    return regs.map((r) => ({
      userId: r.userId, avatarUrl: '', nickname: '行者', name: '行者',
      gender: '未知', commonActivityCount: 0, motto: '把身体从屏幕里带出来。', status: r.status,
    }))
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
    return { items, total }
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
    const inv = this.invoiceRepo.create({ orderId, userId: order.userId, activityId: order.activityId, title, taxNo: taxNo || null, amount: invAmount, status: 'REQUESTED' })
    return this.invoiceRepo.save(inv)
  }

  async getInvoices(page: number, limit: number, filters?: { status?: string; activityId?: number; userId?: string }) {
    const qb = this.invoiceRepo.createQueryBuilder('i').orderBy('i.createdAt', 'DESC')
    if (filters?.status) qb.andWhere('i.status = :st', { st: filters.status })
    if (filters?.activityId) qb.andWhere('i.activityId = :aid', { aid: filters.activityId })
    if (filters?.userId) qb.andWhere('i.userId = :uid', { uid: filters.userId })
    qb.skip((page - 1) * limit).take(limit)
    const [items, total] = await qb.getManyAndCount()
    return { items, total }
  }

  async issueInvoice(id: number) {
    const inv = await this.invoiceRepo.findOne({ where: { id } })
    if (!inv) throw new NotFoundException(`Invoice ${id} not found`)
    if (inv.status !== 'REQUESTED') throw new BadRequestException('Invoice already issued or canceled')
    inv.status = 'ISSUED'; inv.issuedAt = new Date()
    return this.invoiceRepo.save(inv)
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
