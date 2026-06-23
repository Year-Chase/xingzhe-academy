import { Controller, Get, Post, Delete, Query, Param, Body, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { ActivityRegistration } from './entities/activity-registration.entity'
import { ActivityOrder } from './entities/activity-order.entity'
import { ActivityRefund } from './entities/activity-refund.entity'
import { ActivityInvoice } from './entities/activity-invoice.entity'
import { UserTag } from './entities/user-tag.entity'
import { UserNote } from './entities/user-note.entity'
import { UserProfile } from './entities/user-profile.entity'
import { UserInviteRecord } from './entities/user-invite-record.entity'
import { ActivityInviteRecord } from './entities/activity-invite-record.entity'

@Controller('admin/crm')
export class AdminCrmController {
  constructor(
    @InjectRepository(ActivityRegistration)
    private readonly regRepo: Repository<ActivityRegistration>,
    @InjectRepository(ActivityOrder)
    private readonly orderRepo: Repository<ActivityOrder>,
    @InjectRepository(ActivityRefund)
    private readonly refundRepo: Repository<ActivityRefund>,
    @InjectRepository(ActivityInvoice)
    private readonly invoiceRepo: Repository<ActivityInvoice>,
    @InjectRepository(UserTag)
    private readonly tagRepo: Repository<UserTag>,
    @InjectRepository(UserNote)
    private readonly noteRepo: Repository<UserNote>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
    @InjectRepository(UserInviteRecord)
    private readonly inviteRepo: Repository<UserInviteRecord>,
    @InjectRepository(ActivityInviteRecord)
    private readonly activityInviteRepo: Repository<ActivityInviteRecord>,
  ) {}

  // ──── GET /admin/crm/users ────
  @Get('users')
  async getUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('keyword') keyword?: string,
    @Query('tag') tag?: string,
    @Query('birthYearMonth') birthYearMonth?: string,
    @Query('registeredStart') registeredStart?: string,
    @Query('registeredEnd') registeredEnd?: string,
    @Query('lastLoginStart') lastLoginStart?: string,
    @Query('lastLoginEnd') lastLoginEnd?: string,
    @Query('inviteRegisterMin') inviteRegisterMin?: number,
    @Query('inviteActivityMin') inviteActivityMin?: number,
  ) {
    const pageNum = Math.max(1, Number(page) || 1)
    const limitNum = Math.max(1, Math.min(200, Number(limit) || 20))

    // Collect all distinct userIds (no select — eager relations)
    let userIds = new Set<string>()

    const regs = await this.regRepo.find()
    regs.forEach(r => { if (r.userId) userIds.add(r.userId) })

    const orders = await this.orderRepo.find()
    orders.forEach(o => { if (o.userId) userIds.add(o.userId) })

    // Tag filter
    if (tag) {
      const tagged = await this.tagRepo.find({ where: { tag } })
      const taggedIds = new Set(tagged.map(t => t.userId))
      userIds = new Set([...userIds].filter(id => taggedIds.has(id)))
    }

    // Keyword filter
    if (keyword) {
      userIds = new Set([...userIds].filter(id => id.includes(keyword)))
    }

    // birthYearMonth filter (from UserProfile)
    if (birthYearMonth) {
      const profiles = await this.profileRepo.find({ where: { birthYearMonth } })
      const profileIds = new Set(profiles.map(p => p.userId))
      userIds = new Set([...userIds].filter(id => profileIds.has(id)))
    }

    // registeredAt range filter (from UserProfile)
    if (registeredStart || registeredEnd) {
      const allProfiles = await this.profileRepo.find()
      const filtered = allProfiles.filter(p => {
        if (!p.registeredAt) return false
        if (registeredStart && new Date(p.registeredAt) < new Date(registeredStart)) return false
        if (registeredEnd && new Date(p.registeredAt) > new Date(registeredEnd)) return false
        return true
      })
      const profileIds = new Set(filtered.map(p => p.userId))
      userIds = new Set([...userIds].filter(id => profileIds.has(id)))
    }

    // lastLoginAt range filter (from UserProfile)
    if (lastLoginStart || lastLoginEnd) {
      const allProfiles = await this.profileRepo.find()
      const filtered = allProfiles.filter(p => {
        if (!p.lastLoginAt) return false
        if (lastLoginStart && new Date(p.lastLoginAt) < new Date(lastLoginStart)) return false
        if (lastLoginEnd && new Date(p.lastLoginAt) > new Date(lastLoginEnd)) return false
        return true
      })
      const profileIds = new Set(filtered.map(p => p.userId))
      userIds = new Set([...userIds].filter(id => profileIds.has(id)))
    }

    // inviteRegisterMin filter
    if (inviteRegisterMin !== undefined && Number(inviteRegisterMin) >= 0) {
      const min = Number(inviteRegisterMin)
      const inviteCounts = await this.inviteRepo
        .createQueryBuilder('r')
        .select('r.inviterUserId', 'uid')
        .addSelect('COUNT(r.id)', 'cnt')
        .groupBy('r.inviterUserId')
        .getRawMany()
      const qualifiedIds = new Set(inviteCounts.filter(r => Number(r.cnt) >= min).map(r => r.uid))
      userIds = new Set([...userIds].filter(id => qualifiedIds.has(id)))
    }

    // inviteActivityMin filter
    if (inviteActivityMin !== undefined && Number(inviteActivityMin) >= 0) {
      const min = Number(inviteActivityMin)
      const inviteCounts = await this.activityInviteRepo
        .createQueryBuilder('a')
        .select('a.inviterUserId', 'uid')
        .addSelect('COUNT(a.id)', 'cnt')
        .groupBy('a.inviterUserId')
        .getRawMany()
      const qualifiedIds = new Set(inviteCounts.filter(r => Number(r.cnt) >= min).map(r => r.uid))
      userIds = new Set([...userIds].filter(id => qualifiedIds.has(id)))
    }

    const allUserIds = [...userIds].sort()
    const total = allUserIds.length
    const paged = allUserIds.slice((pageNum - 1) * limitNum, pageNum * limitNum)

    // Pre-fetch all profiles for batch lookup
    const profiles = await this.profileRepo.find()
    const profileMap = new Map(profiles.map(p => [p.userId, p]))

    // Build items
    const items: any[] = []
    for (const uid of paged) {
      const profile = profileMap.get(uid) || null

      // Registration stats
      const regCount = await this.regRepo.count({ where: { userId: uid } })
      const checkedInCount = await this.regRepo.count({ where: { userId: uid, status: 'CHECKED_IN' } })

      // Order stats (exclude PENDING)
      const paidOrders = await this.orderRepo.find({ where: { userId: uid, status: In(['PAID', 'PARTIAL_REFUND', 'REFUNDED']) } })
      const orderCount = paidOrders.length
      const paidAmount = paidOrders.reduce((s, o) => s + Number(o.amount || 0), 0)

      // Refund stats
      const refunds = await this.refundRepo.find({ where: { userId: uid, status: 'SUCCESS' } })
      const refundedAmount = refunds.reduce((s, r) => s + Number(r.amount || 0), 0)

      // Tags
      const tags = await this.tagRepo.find({ where: { userId: uid } })

      // Last activity time
      const latestReg = await this.regRepo.findOne({ where: { userId: uid }, order: { createdAt: 'DESC' } })

      // Invite counts
      const inviteRegisterCount = await this.inviteRepo.count({ where: { inviterUserId: uid } })
      const inviteActivityCount = await this.activityInviteRepo.count({ where: { inviterUserId: uid } })

      items.push({
        userId: uid,
        nickname: null,
        birthYearMonth: profile?.birthYearMonth || null,
        registrationCount: regCount,
        orderCount,
        checkedInCount,
        paidAmount,
        refundedAmount,
        netAmount: paidAmount - refundedAmount,
        tags: tags.map(t => ({ id: t.id, tag: t.tag })),
        registeredAt: profile?.registeredAt?.toISOString() || null,
        lastLoginAt: profile?.lastLoginAt?.toISOString() || null,
        lastActivityTime: latestReg?.createdAt?.toISOString() || null,
        inviteRegisterCount,
        inviteActivityCount,
      })
    }

    return { items, total, page: pageNum, limit: limitNum }
  }

  // ──── GET /admin/crm/users/:userId ────
  @Get('users/:userId')
  async getUserDetail(@Param('userId') userId: string) {
    const profile = await this.profileRepo.findOne({ where: { userId } })

    // Compute age from birthYearMonth
    let age: number | null = null
    if (profile?.birthYearMonth) {
      const m = profile.birthYearMonth.match(/^(\d{4})-(\d{2})$/)
      if (m) {
        const birthYear = Number(m[1])
        const birthMonth = Number(m[2])
        const now = new Date()
        const currYear = now.getFullYear()
        const currMonth = now.getMonth() + 1
        age = currYear - birthYear
        if (currMonth < birthMonth) age -= 1
        if (age < 0) age = 0
      }
    }

    // Summary stats
    const regCount = await this.regRepo.count({ where: { userId } })
    const checkedInCount = await this.regRepo.count({ where: { userId, status: 'CHECKED_IN' } })
    const paidOrders = await this.orderRepo.find({ where: { userId, status: In(['PAID', 'PARTIAL_REFUND', 'REFUNDED']) } })
    const orderCount = paidOrders.length
    const paidAmount = paidOrders.reduce((s, o) => s + Number(o.amount || 0), 0)
    const refunds = await this.refundRepo.find({ where: { userId, status: 'SUCCESS' } })
    const refundedAmount = refunds.reduce((s, r) => s + Number(r.amount || 0), 0)

    // Invite counts
    const inviteRegisterCount = await this.inviteRepo.count({ where: { inviterUserId: userId } })
    const inviteActivityCount = await this.activityInviteRepo.count({ where: { inviterUserId: userId } })

    // Detailed records
    const registrations = await this.regRepo.find({ where: { userId }, order: { createdAt: 'DESC' } })
    const orders = await this.orderRepo.find({ where: { userId }, order: { createdAt: 'DESC' } })
    const allRefunds = await this.refundRepo.find({ where: { userId }, order: { createdAt: 'DESC' } })
    const invoices = await this.invoiceRepo.find({ where: { userId }, order: { createdAt: 'DESC' } })
    const tags = await this.tagRepo.find({ where: { userId }, order: { createdAt: 'DESC' } })
    const notes = await this.noteRepo.find({ where: { userId }, order: { createdAt: 'DESC' } })

    // Invite records (who did this user invite to register)
    const inviteRecords = await this.inviteRepo.find({ where: { inviterUserId: userId }, order: { createdAt: 'DESC' } })
    const inviteRecordsOut = inviteRecords.map(r => ({
      id: r.id, inviteeUserId: r.inviteeUserId, inviteeName: null, createdAt: r.createdAt,
    }))

    // Activity invite records (who did this user invite to activities)
    const activityInviteRecords = await this.activityInviteRepo.find({ where: { inviterUserId: userId }, order: { createdAt: 'DESC' } })
    const activityInviteRecordsOut = activityInviteRecords.map(r => ({
      id: r.id, activityId: r.activityId, activityTitle: null, inviteeUserId: r.inviteeUserId, inviteeName: null, createdAt: r.createdAt,
    }))

    // Enhanced registrations: include city (from eager-loaded activity), certificate (null), inviter (null)
    const registrationsOut = registrations.map(r => ({
      id: r.id,
      activityId: r.activityId,
      activityTitle: (r as any).activity?.title || null,
      city: (r as any).activity?.city || null,
      status: r.status,
      createdAt: r.createdAt,
      certificate: null,
      inviter: null,
    }))

    return {
      userId,
      nickname: null,
      birthYearMonth: profile?.birthYearMonth || null,
      age,
      registeredAt: profile?.registeredAt?.toISOString() || null,
      lastLoginAt: profile?.lastLoginAt?.toISOString() || null,
      summary: {
        registrationCount: regCount,
        orderCount,
        checkedInCount,
        paidAmount,
        refundedAmount,
        netAmount: paidAmount - refundedAmount,
        inviteRegisterCount,
        inviteActivityCount,
      },
      registrations: registrationsOut,
      orders,
      refunds: allRefunds,
      invoices,
      certificates: [],
      inviteRecords: inviteRecordsOut,
      activityInviteRecords: activityInviteRecordsOut,
      tags,
      notes,
    }
  }

  // ──── POST /admin/crm/users/:userId/tags ────
  @Post('users/:userId/tags')
  async addTag(@Param('userId') userId: string, @Body() body: { tag: string }) {
    const tagVal = (body?.tag || '').trim()
    if (!tagVal) throw new BadRequestException('tag 不能为空')
    if (tagVal.length > 50) throw new BadRequestException('tag 最长 50 字')

    const existing = await this.tagRepo.findOne({ where: { userId, tag: tagVal } })
    if (existing) return existing

    const created = this.tagRepo.create({ userId, tag: tagVal })
    return this.tagRepo.save(created)
  }

  // ──── DELETE /admin/crm/users/:userId/tags/:tagId ────
  @Delete('users/:userId/tags/:tagId')
  async deleteTag(@Param('userId') userId: string, @Param('tagId') tagId: number) {
    const tag = await this.tagRepo.findOne({ where: { id: tagId, userId } })
    if (!tag) return { ok: true, deleted: false, reason: 'not found' }
    await this.tagRepo.remove(tag)
    return { ok: true, deleted: true }
  }

  // ──── POST /admin/crm/users/:userId/notes ────
  @Post('users/:userId/notes')
  async addNote(@Param('userId') userId: string, @Body() body: { note: string }) {
    const noteVal = (body?.note || '').trim()
    if (!noteVal) throw new BadRequestException('note 不能为空')

    const created = this.noteRepo.create({ userId, note: noteVal })
    return this.noteRepo.save(created)
  }

  // ──── DELETE /admin/crm/users/:userId/notes/:noteId ────
  @Delete('users/:userId/notes/:noteId')
  async deleteNote(@Param('userId') userId: string, @Param('noteId') noteId: number) {
    const note = await this.noteRepo.findOne({ where: { id: noteId, userId } })
    if (!note) return { ok: true, deleted: false, reason: 'not found' }
    await this.noteRepo.remove(note)
    return { ok: true, deleted: true }
  }
}
