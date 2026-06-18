import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { randomUUID } from 'crypto'
import { Activity } from './entities/activity.entity'
import { ActivityRegistration } from './entities/activity-registration.entity'
import { ActivityOrder } from './entities/activity-order.entity'
import { ActivityQR } from './entities/activity-qr.entity'

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

    const order = this.orderRepo.create({ registrationId: saved.id, amount: 0 })
    await this.orderRepo.save(order)

    return { status: 'REGISTERED', id: saved.id }
  }

  // ──── pay ────
  async pay(userId: string, activityId: number) {
    const reg = await this.findReg(userId, activityId)

    if (reg.status !== 'REGISTERED') {
      throw new BadRequestException(`Cannot pay: status is ${reg.status}, expected REGISTERED`)
    }

    reg.status = 'PAID'
    await this.regRepo.save(reg)
    return { status: 'PAID', id: reg.id }
  }

  // ──── generateQR ────
  async generateQR(userId: string, activityId: number) {
    const reg = await this.findReg(userId, activityId)

    if (reg.status !== 'PAID') {
      throw new BadRequestException(`Cannot generate QR: status is ${reg.status}, expected PAID`)
    }

    const existing = await this.qrRepo.findOne({ where: { registrationId: reg.id } })
    if (existing && existing.status === 'ACTIVE') {
      if (existing.expiresAt && new Date() > existing.expiresAt) {
        existing.status = 'EXPIRED'
        await this.qrRepo.save(existing)
      } else {
        return { code: existing.code, status: 'ACTIVE' }
      }
    }

    const qr = this.qrRepo.create({
      registrationId: reg.id,
      code: randomUUID(),
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
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

  // ──── getRegisteredCount ────
  async getRegisteredCount(activityId: number) {
    return this.regRepo.count({ where: { activityId } })
  }

  // ──── private helpers ────
  private async ensureActivity(id: number) {
    const a = await this.activityRepo.findOne({ where: { id } })
    if (!a) {
      const created = this.activityRepo.create({ id, title: `活动 #${id}`, status: 'active' })
      await this.activityRepo.save(created)
    }
  }

  private async findReg(userId: string, activityId: number) {
    const reg = await this.regRepo.findOne({ where: { userId, activityId } })
    if (!reg) throw new NotFoundException(`No registration for user ${userId} on activity ${activityId}`)
    return reg
  }
}
