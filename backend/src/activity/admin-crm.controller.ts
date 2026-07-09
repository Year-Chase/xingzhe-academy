import { Controller, Get, Post, Delete, Patch, Query, Param, Body, BadRequestException, UseGuards } from '@nestjs/common'
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
import { User } from '../users/entities/user.entity'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

// ── Helpers ──
function computeAge(birthday: string | null, birthYM: string | null): number | null {
  const raw = birthday || birthYM
  if (!raw) return null
  const m = raw.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/)
  if (!m) return null
  const by = Number(m[1]), bm = Number(m[2]), bd = Number(m[3] || '1')
  const now = new Date()
  let age = now.getFullYear() - by
  if (now.getMonth() + 1 < bm || (now.getMonth() + 1 === bm && now.getDate() < bd)) age -= 1
  return Math.max(0, age)
}

/** Merge User + UserProfile with User priority, returns safe defaults */
function mergeUserFields(u: User | null, p: UserProfile | null, userId: string) {
  const birthYearMonth = u?.birthYearMonth || p?.birthYearMonth || null
  const registeredAt = u?.registeredAt || p?.registeredAt || null
  const lastLoginAt = u?.lastLoginAt || p?.lastLoginAt || null
  return {
    nickname: u?.nickname || `用户 ${userId}`,
    avatarUrl: u?.avatarUrl || null,
    gender: u?.gender || null,
    phone: u?.phone || null,
    birthday: u?.birthday || null,
    birthYearMonth,
    intro: u?.intro || null,
    identityType: u?.identityType || null,
    isMember: u?.isMember ?? false,
    isLifetimeMember: u?.isLifetimeMember ?? false,
    registeredAt,
    lastLoginAt,
    status: u?.status || null,
  }
}

@Controller('admin/crm')
@UseGuards(JwtAuthGuard)
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
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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

    // Collect all distinct userIds from all sources
    let userIds = new Set<string>()

    const regs = await this.regRepo.find()
    regs.forEach(r => { if (r.userId) userIds.add(r.userId) })

    const orders = await this.orderRepo.find()
    orders.forEach(o => { if (o.userId) userIds.add(o.userId) })

    // Also collect from User table (for users who logged in but have no activity data)
    const users = await this.userRepo.find()
    users.forEach(u => { if (u.id) userIds.add(u.id) })

    // ── Filters ──

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

    // birthYearMonth — check both User and UserProfile
    if (birthYearMonth) {
      const uSet = new Set(users.filter(u => u.birthYearMonth === birthYearMonth).map(u => u.id))
      const profiles = await this.profileRepo.find({ where: { birthYearMonth } })
      profiles.forEach(p => uSet.add(p.userId))
      userIds = new Set([...userIds].filter(id => uSet.has(id)))
    }

    // registeredAt range
    if (registeredStart || registeredEnd) {
      const rs = registeredStart ? new Date(registeredStart) : null
      const re = registeredEnd ? new Date(registeredEnd) : null
      const qualified = new Set<string>()
      for (const u of users) {
        if (!u.registeredAt) continue
        if (rs && new Date(u.registeredAt) < rs) continue
        if (re && new Date(u.registeredAt) > re) continue
        qualified.add(u.id)
      }
      const profiles = await this.profileRepo.find()
      for (const p of profiles) {
        if (!p.registeredAt) continue
        if (rs && new Date(p.registeredAt) < rs) continue
        if (re && new Date(p.registeredAt) > re) continue
        qualified.add(p.userId)
      }
      userIds = new Set([...userIds].filter(id => qualified.has(id)))
    }

    // lastLoginAt range
    if (lastLoginStart || lastLoginEnd) {
      const ls = lastLoginStart ? new Date(lastLoginStart) : null
      const le = lastLoginEnd ? new Date(lastLoginEnd) : null
      const qualified = new Set<string>()
      for (const u of users) {
        if (!u.lastLoginAt) continue
        if (ls && new Date(u.lastLoginAt) < ls) continue
        if (le && new Date(u.lastLoginAt) > le) continue
        qualified.add(u.id)
      }
      const profiles = await this.profileRepo.find()
      for (const p of profiles) {
        if (!p.lastLoginAt) continue
        if (ls && new Date(p.lastLoginAt) < ls) continue
        if (le && new Date(p.lastLoginAt) > le) continue
        qualified.add(p.userId)
      }
      userIds = new Set([...userIds].filter(id => qualified.has(id)))
    }

    // inviteRegisterMin
    if (inviteRegisterMin !== undefined && Number(inviteRegisterMin) >= 0) {
      const min = Number(inviteRegisterMin)
      const counts = await this.inviteRepo
        .createQueryBuilder('r').select('r.inviterUserId', 'uid').addSelect('COUNT(r.id)', 'cnt')
        .groupBy('r.inviterUserId').getRawMany()
      const qIds = new Set(counts.filter(r => Number(r.cnt) >= min).map(r => r.uid))
      userIds = new Set([...userIds].filter(id => qIds.has(id)))
    }

    // inviteActivityMin
    if (inviteActivityMin !== undefined && Number(inviteActivityMin) >= 0) {
      const min = Number(inviteActivityMin)
      const counts = await this.activityInviteRepo
        .createQueryBuilder('a').select('a.inviterUserId', 'uid').addSelect('COUNT(a.id)', 'cnt')
        .groupBy('a.inviterUserId').getRawMany()
      const qIds = new Set(counts.filter(r => Number(r.cnt) >= min).map(r => r.uid))
      userIds = new Set([...userIds].filter(id => qIds.has(id)))
    }

    const allUserIds = [...userIds].sort()
    const total = allUserIds.length
    const paged = allUserIds.slice((pageNum - 1) * limitNum, pageNum * limitNum)

    // Pre-build lookup maps
    const userMap = new Map(users.map(u => [u.id, u]))
    const profiles = await this.profileRepo.find()
    const profileMap = new Map(profiles.map(p => [p.userId, p]))

    // Build items
    const items: any[] = []
    for (const uid of paged) {
      const u = userMap.get(uid) || null
      const p = profileMap.get(uid) || null
      const merged = mergeUserFields(u, p, uid)

      const regCount = await this.regRepo.count({ where: { userId: uid } })
      const checkedInCount = await this.regRepo.count({ where: { userId: uid, status: 'CHECKED_IN' } })
      const paidOrders = await this.orderRepo.find({ where: { userId: uid, status: In(['PAID', 'PARTIAL_REFUND', 'REFUNDED']) } })
      const orderCount = paidOrders.length
      const paidAmount = paidOrders.reduce((s, o) => s + Number(o.amount || 0), 0)
      const refunds = await this.refundRepo.find({ where: { userId: uid, status: 'SUCCESS' } })
      const refundedAmount = refunds.reduce((s, r) => s + Number(r.amount || 0), 0)
      const tags = await this.tagRepo.find({ where: { userId: uid } })
      const latestReg = await this.regRepo.findOne({ where: { userId: uid }, order: { createdAt: 'DESC' } })
      const inviteRegisterCount = await this.inviteRepo.count({ where: { inviterUserId: uid } })
      const inviteActivityCount = await this.activityInviteRepo.count({ where: { inviterUserId: uid } })

      const age = computeAge(merged.birthday, merged.birthYearMonth)

      items.push({
        userId: uid,
        nickname: merged.nickname,
        avatarUrl: merged.avatarUrl,
        gender: merged.gender,
        phone: merged.phone,
        birthday: merged.birthday,
        birthYearMonth: merged.birthYearMonth,
        intro: merged.intro,
        age,
        identityType: merged.identityType || '未设置',
        isMember: merged.isMember,
        isLifetimeMember: merged.isLifetimeMember,
        registeredAt: merged.registeredAt ? (merged.registeredAt instanceof Date ? merged.registeredAt.toISOString() : merged.registeredAt) : null,
        lastLoginAt: merged.lastLoginAt ? (merged.lastLoginAt instanceof Date ? merged.lastLoginAt.toISOString() : merged.lastLoginAt) : null,
        registrationCount: regCount,
        orderCount,
        checkedInCount,
        paidAmount,
        refundedAmount,
        netAmount: paidAmount - refundedAmount,
        tags: tags.map(t => ({ id: t.id, tag: t.tag })),
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
    const u = await this.userRepo.findOne({ where: { id: userId } }).catch(() => null)
    const p = await this.profileRepo.findOne({ where: { userId } })
    const merged = mergeUserFields(u, p, userId)
    const age = computeAge(merged.birthday, merged.birthYearMonth)

    // Stats
    const regCount = await this.regRepo.count({ where: { userId } })
    const checkedInCount = await this.regRepo.count({ where: { userId, status: 'CHECKED_IN' } })
    const paidOrders = await this.orderRepo.find({ where: { userId, status: In(['PAID', 'PARTIAL_REFUND', 'REFUNDED']) } })
    const orderCount = paidOrders.length
    const paidAmount = paidOrders.reduce((s, o) => s + Number(o.amount || 0), 0)
    const refunds = await this.refundRepo.find({ where: { userId, status: 'SUCCESS' } })
    const refundedAmount = refunds.reduce((s, r) => s + Number(r.amount || 0), 0)
    const inviteRegisterCount = await this.inviteRepo.count({ where: { inviterUserId: userId } })
    const inviteActivityCount = await this.activityInviteRepo.count({ where: { inviterUserId: userId } })

    // Records
    const registrations = await this.regRepo.find({ where: { userId }, order: { createdAt: 'DESC' } })
    const orders = await this.orderRepo.find({ where: { userId }, order: { createdAt: 'DESC' } })
    const allRefunds = await this.refundRepo.find({ where: { userId }, order: { createdAt: 'DESC' } })
    const invoices = await this.invoiceRepo.find({ where: { userId }, order: { createdAt: 'DESC' } })
    const tags = await this.tagRepo.find({ where: { userId }, order: { createdAt: 'DESC' } })
    const notes = await this.noteRepo.find({ where: { userId }, order: { createdAt: 'DESC' } })

    const inviteRecords = await this.inviteRepo.find({ where: { inviterUserId: userId }, order: { createdAt: 'DESC' } })
    const activityInviteRecords = await this.activityInviteRepo.find({ where: { inviterUserId: userId }, order: { createdAt: 'DESC' } })

    const registrationsOut = registrations.map(r => ({
      id: r.id, activityId: r.activityId,
      activityTitle: (r as any).activity?.title || null,
      city: (r as any).activity?.city || null,
      status: r.status, createdAt: r.createdAt,
      certificate: null, inviter: null,
    }))

    return {
      userId,
      nickname: merged.nickname,
      avatarUrl: merged.avatarUrl,
      gender: merged.gender || 'unknown',
      phone: merged.phone,
      birthday: merged.birthday,
      birthYearMonth: merged.birthYearMonth,
      intro: merged.intro,
      age,
      identityType: merged.identityType || '未设置',
      isMember: merged.isMember,
      isLifetimeMember: merged.isLifetimeMember,
      registeredAt: merged.registeredAt ? (merged.registeredAt instanceof Date ? merged.registeredAt.toISOString() : merged.registeredAt) : null,
      lastLoginAt: merged.lastLoginAt ? (merged.lastLoginAt instanceof Date ? merged.lastLoginAt.toISOString() : merged.lastLoginAt) : null,
      summary: {
        registrationCount: regCount, orderCount, checkedInCount,
        paidAmount, refundedAmount, netAmount: paidAmount - refundedAmount,
        inviteRegisterCount, inviteActivityCount,
      },
      registrations: registrationsOut,
      orders,
      refunds: allRefunds,
      invoices,
      certificates: [],
      inviteRecords: inviteRecords.map(r => ({ id: r.id, inviteeUserId: r.inviteeUserId, inviteeName: null, createdAt: r.createdAt })),
      activityInviteRecords: activityInviteRecords.map(r => ({ id: r.id, activityId: r.activityId, activityTitle: null, inviteeUserId: r.inviteeUserId, inviteeName: null, createdAt: r.createdAt })),
      tags,
      notes,
    }
  }

  // ──── PATCH /admin/crm/users/:userId/type ────
  @Patch('users/:userId/type')
  async updateUserType(@Param('userId') userId: string, @Body() body: { identityType: string }) {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) throw new BadRequestException(`User ${userId} not found`)

    // Allow setting or clearing identityType
    const val = (body?.identityType ?? '').trim()
    user.identityType = val || null
    await this.userRepo.save(user)

    // Does NOT modify Registration / Order / Refund / Invoice / UserProfile
    return { userId, identityType: user.identityType }
  }

  // ──── Tag / Note management (unchanged) ────

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

  @Delete('users/:userId/tags/:tagId')
  async deleteTag(@Param('userId') userId: string, @Param('tagId') tagId: number) {
    const tag = await this.tagRepo.findOne({ where: { id: tagId, userId } })
    if (!tag) return { ok: true, deleted: false, reason: 'not found' }
    await this.tagRepo.remove(tag)
    return { ok: true, deleted: true }
  }

  @Post('users/:userId/notes')
  async addNote(@Param('userId') userId: string, @Body() body: { note: string }) {
    const noteVal = (body?.note || '').trim()
    if (!noteVal) throw new BadRequestException('note 不能为空')
    const created = this.noteRepo.create({ userId, note: noteVal })
    return this.noteRepo.save(created)
  }

  @Delete('users/:userId/notes/:noteId')
  async deleteNote(@Param('userId') userId: string, @Param('noteId') noteId: number) {
    const note = await this.noteRepo.findOne({ where: { id: noteId, userId } })
    if (!note) return { ok: true, deleted: false, reason: 'not found' }
    await this.noteRepo.remove(note)
    return { ok: true, deleted: true }
  }
}
