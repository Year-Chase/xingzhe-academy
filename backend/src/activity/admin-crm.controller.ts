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
import { TagDefinition } from './entities/tag-definition.entity'
import { UserTagRelation } from './entities/user-tag-relation.entity'
import { SystemTagRefreshJob } from './jobs/system-tag-refresh.job'
import { User } from '../users/entities/user.entity'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

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
    private readonly legacyTagRepo: Repository<UserTag>,
    @InjectRepository(UserNote)
    private readonly noteRepo: Repository<UserNote>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
    @InjectRepository(UserInviteRecord)
    private readonly inviteRepo: Repository<UserInviteRecord>,
    @InjectRepository(ActivityInviteRecord)
    private readonly activityInviteRepo: Repository<ActivityInviteRecord>,
    @InjectRepository(TagDefinition)
    private readonly tagDefRepo: Repository<TagDefinition>,
    @InjectRepository(UserTagRelation)
    private readonly tagRelationRepo: Repository<UserTagRelation>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly systemTagJob: SystemTagRefreshJob,
  ) {}

  @Get('tags')
  async getTags(@Query('type') type?: 'SYSTEM' | 'CUSTOM') {
    const where = type ? ({ type } as any) : {}
    return this.tagDefRepo.find({ where, order: { type: 'ASC', name: 'ASC' } })
  }

  @Post('tags')
  async createCustomTag(@Body() body: { name: string; description?: string; isEnabled?: boolean }) {
    const name = (body?.name || '').trim()
    if (!name) throw new BadRequestException('标签名称不能为空')
    if (name.length > 80) throw new BadRequestException('标签名称最长 80 字')
    const existing = await this.tagDefRepo.findOne({ where: { name, type: 'CUSTOM' } as any })
    if (existing) throw new BadRequestException('标签名称已存在')
    return this.tagDefRepo.save(this.tagDefRepo.create({
      name,
      type: 'CUSTOM',
      description: body?.description || null,
      ruleCode: null,
      isEnabled: body?.isEnabled !== false,
    }))
  }

  @Patch('tags/:id')
  async updateCustomTag(@Param('id') id: string, @Body() body: { name?: string; description?: string; isEnabled?: boolean }) {
    const tag = await this.tagDefRepo.findOne({ where: { id } as any })
    if (!tag) throw new BadRequestException('标签不存在')
    if (tag.type === 'SYSTEM') throw new BadRequestException('系统标签不允许修改规则或名称')
    if (body.name !== undefined) {
      const name = String(body.name || '').trim()
      if (!name) throw new BadRequestException('标签名称不能为空')
      const existing = await this.tagDefRepo.findOne({ where: { name, type: 'CUSTOM' } as any })
      if (existing && existing.id !== tag.id) throw new BadRequestException('标签名称已存在')
      tag.name = name
    }
    if (body.description !== undefined) tag.description = body.description || null
    if (body.isEnabled !== undefined) tag.isEnabled = body.isEnabled !== false
    return this.tagDefRepo.save(tag)
  }

  @Delete('tags/:id')
  async deleteCustomTag(@Param('id') id: string) {
    const tag = await this.tagDefRepo.findOne({ where: { id } as any })
    if (!tag) return { ok: true, deleted: false }
    if (tag.type === 'SYSTEM') throw new BadRequestException('系统标签不允许删除')
    const relations = await this.tagRelationRepo.find({ where: { tagId: id } as any })
    if (relations.length > 0) await this.tagRelationRepo.remove(relations)
    await this.tagDefRepo.remove(tag)
    return { ok: true, deleted: true }
  }

  @Post('system-tags/refresh')
  async refreshSystemTags() {
    await this.systemTagJob.refresh()
    return { ok: true }
  }

  @Get('users')
  async getUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('keyword') keyword?: string,
    @Query('tag') tag?: string,
    @Query('tagId') tagId?: string,
    @Query('systemTagId') systemTagId?: string,
    @Query('customTagId') customTagId?: string,
    @Query('identityType') identityType?: string,
    @Query('birthYearMonth') birthYearMonth?: string,
    @Query('registeredStart') registeredStart?: string,
    @Query('registeredEnd') registeredEnd?: string,
    @Query('lastLoginStart') lastLoginStart?: string,
    @Query('lastLoginEnd') lastLoginEnd?: string,
    @Query('activityCountMin') activityCountMin?: number,
    @Query('checkinCountMin') checkinCountMin?: number,
    @Query('paidAmountMin') paidAmountMin?: number,
    @Query('inviteRegisterMin') inviteRegisterMin?: number,
    @Query('inviteActivityMin') inviteActivityMin?: number,
  ) {
    const pageNum = Math.max(1, Number(page) || 1)
    const limitNum = Math.max(1, Math.min(200, Number(limit) || 20))
    let userIds = new Set<string>()

    const regs = await this.regRepo.find()
    regs.forEach(r => { if (r.userId) userIds.add(r.userId) })
    const orders = await this.orderRepo.find()
    orders.forEach(o => { if (o.userId) userIds.add(o.userId) })
    const users = await this.userRepo.find()
    users.forEach(u => { if (u.id) userIds.add(u.id) })

    if (identityType) {
      const ids = new Set(users.filter(u => (u.identityType || '') === identityType).map(u => u.id))
      userIds = new Set([...userIds].filter(id => ids.has(id)))
    }

    const relationFilterIds = [tagId, systemTagId, customTagId].filter(Boolean) as string[]
    if (relationFilterIds.length > 0) {
      for (const tid of relationFilterIds) {
        const relations = await this.tagRelationRepo.find({ where: { tagId: tid } as any })
        const ids = new Set(relations.map(r => r.userId))
        userIds = new Set([...userIds].filter(id => ids.has(id)))
      }
    }

    if (tag) {
      const defs = await this.tagDefRepo.find({ where: { name: tag } as any })
      const tagIds = defs.map(d => d.id)
      const relationIds = tagIds.length ? new Set((await this.tagRelationRepo.find({ where: { tagId: In(tagIds) } as any })).map(t => t.userId)) : new Set<string>()
      const legacy = await this.legacyTagRepo.find({ where: { tag } })
      legacy.forEach(t => relationIds.add(t.userId))
      userIds = new Set([...userIds].filter(id => relationIds.has(id)))
    }

    if (keyword) {
      const kw = keyword.trim()
      userIds = new Set([...userIds].filter(id => id.includes(kw) || (users.find(u => u.id === id)?.nickname || '').includes(kw)))
    }

    if (birthYearMonth) {
      const uSet = new Set(users.filter(u => u.birthYearMonth === birthYearMonth).map(u => u.id))
      const profiles = await this.profileRepo.find({ where: { birthYearMonth } })
      profiles.forEach(p => uSet.add(p.userId))
      userIds = new Set([...userIds].filter(id => uSet.has(id)))
    }

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

    if (inviteRegisterMin !== undefined && Number(inviteRegisterMin) >= 0) {
      const min = Number(inviteRegisterMin)
      const counts = await this.inviteRepo.createQueryBuilder('r').select('r.inviterUserId', 'uid').addSelect('COUNT(r.id)', 'cnt').groupBy('r.inviterUserId').getRawMany()
      const qIds = new Set(counts.filter(r => Number(r.cnt) >= min).map(r => r.uid))
      userIds = new Set([...userIds].filter(id => qIds.has(id)))
    }

    if (inviteActivityMin !== undefined && Number(inviteActivityMin) >= 0) {
      const min = Number(inviteActivityMin)
      const counts = await this.activityInviteRepo.createQueryBuilder('a').select('a.inviterUserId', 'uid').addSelect('COUNT(a.id)', 'cnt').groupBy('a.inviterUserId').getRawMany()
      const qIds = new Set(counts.filter(r => Number(r.cnt) >= min).map(r => r.uid))
      userIds = new Set([...userIds].filter(id => qIds.has(id)))
    }

    const profiles = await this.profileRepo.find()
    const profileMap = new Map(profiles.map(p => [p.userId, p]))
    const userMap = new Map(users.map(u => [u.id, u]))
    const statsMap = await this.buildStatsMap([...userIds])

    if (activityCountMin !== undefined && Number(activityCountMin) >= 0) {
      const min = Number(activityCountMin)
      userIds = new Set([...userIds].filter(id => (statsMap.get(id)?.registrationCount || 0) >= min))
    }
    if (checkinCountMin !== undefined && Number(checkinCountMin) >= 0) {
      const min = Number(checkinCountMin)
      userIds = new Set([...userIds].filter(id => (statsMap.get(id)?.checkedInCount || 0) >= min))
    }
    if (paidAmountMin !== undefined && Number(paidAmountMin) >= 0) {
      const min = Number(paidAmountMin)
      userIds = new Set([...userIds].filter(id => (statsMap.get(id)?.paidAmount || 0) >= min))
    }

    const getRegisteredTime = (id: string) => {
      const u = userMap.get(id)
      const p = profileMap.get(id)
      const raw = u?.registeredAt || p?.registeredAt || u?.createdAt || p?.createdAt || null
      const time = raw ? new Date(raw).getTime() : 0
      return Number.isFinite(time) ? time : 0
    }
    const allUserIds = [...userIds].sort((a, b) => getRegisteredTime(b) - getRegisteredTime(a) || b.localeCompare(a))
    const total = allUserIds.length
    const paged = allUserIds.slice((pageNum - 1) * limitNum, pageNum * limitNum)
    const tagsMap = await this.buildTagsMap(paged)

    const items: any[] = []
    for (const uid of paged) {
      const u = userMap.get(uid) || null
      const p = profileMap.get(uid) || null
      const merged = mergeUserFields(u, p, uid)
      const latestReg = await this.regRepo.findOne({ where: { userId: uid }, order: { createdAt: 'DESC' } })
      const inviteRegisterCount = await this.inviteRepo.count({ where: { inviterUserId: uid } })
      const inviteActivityCount = await this.activityInviteRepo.count({ where: { inviterUserId: uid } })
      const age = computeAge(merged.birthday, merged.birthYearMonth)
      const stats = statsMap.get(uid) || this.emptyStats()

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
        registrationCount: stats.registrationCount,
        orderCount: stats.orderCount,
        checkedInCount: stats.checkedInCount,
        paidAmount: stats.paidAmount,
        refundedAmount: stats.refundedAmount,
        netAmount: stats.paidAmount - stats.refundedAmount,
        systemTags: tagsMap.get(uid)?.systemTags || [],
        adminTags: tagsMap.get(uid)?.adminTags || [],
        lastActivityTime: latestReg?.createdAt?.toISOString() || null,
        inviteRegisterCount,
        inviteActivityCount,
      })
    }

    return { items, total, page: pageNum, limit: limitNum }
  }

  @Get('users/:userId/overview')
  async getUserOverview(@Param('userId') userId: string) {
    const u = await this.userRepo.findOne({ where: { id: userId } }).catch(() => null)
    const p = await this.profileRepo.findOne({ where: { userId } })
    const merged = mergeUserFields(u, p, userId)
    const stats = await this.buildUserStats(userId)
    const tags = await this.getUserTags(userId)
    return {
      user: {
        id: userId,
        nickname: merged.nickname,
        avatarUrl: merged.avatarUrl,
        identityType: merged.identityType || null,
        isMember: merged.isMember,
        isLifetimeMember: merged.isLifetimeMember,
      },
      stats: {
        activityCount: stats.registrationCount,
        checkinCount: stats.checkedInCount,
        paidAmount: stats.paidAmount,
        refundAmount: stats.refundedAmount,
      },
      systemTags: tags.systemTags.map(t => ({ name: t.name, type: t.type, ruleCode: t.ruleCode, description: t.description, updatedAt: t.updatedAt })),
      adminTags: tags.adminTags.map(t => ({ name: t.name, type: t.type, source: t.source, updatedAt: t.updatedAt })),
    }
  }

  @Get('users/:userId')
  async getUserDetail(@Param('userId') userId: string) {
    const u = await this.userRepo.findOne({ where: { id: userId } }).catch(() => null)
    const p = await this.profileRepo.findOne({ where: { userId } })
    const merged = mergeUserFields(u, p, userId)
    const age = computeAge(merged.birthday, merged.birthYearMonth)
    const stats = await this.buildUserStats(userId)

    const registrations = await this.regRepo.find({ where: { userId }, order: { createdAt: 'DESC' } })
    const orders = await this.orderRepo.find({ where: { userId }, order: { createdAt: 'DESC' } })
    const allRefunds = await this.refundRepo.find({ where: { userId }, order: { createdAt: 'DESC' } })
    const invoices = await this.invoiceRepo.find({ where: { userId }, order: { createdAt: 'DESC' } })
    const tags = await this.getUserTags(userId)
    const notes = await this.noteRepo.find({ where: { userId }, order: { createdAt: 'DESC' } })
    const inviteRecords = await this.inviteRepo.find({ where: { inviterUserId: userId }, order: { createdAt: 'DESC' } })
    const activityInviteRecords = await this.activityInviteRepo.find({ where: { inviterUserId: userId }, order: { createdAt: 'DESC' } })

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
        registrationCount: stats.registrationCount,
        orderCount: stats.orderCount,
        checkedInCount: stats.checkedInCount,
        paidAmount: stats.paidAmount,
        refundedAmount: stats.refundedAmount,
        netAmount: stats.paidAmount - stats.refundedAmount,
        inviteRegisterCount: await this.inviteRepo.count({ where: { inviterUserId: userId } }),
        inviteActivityCount: await this.activityInviteRepo.count({ where: { inviterUserId: userId } }),
      },
      registrations: registrationsOut,
      orders,
      refunds: allRefunds,
      invoices,
      certificates: [],
      inviteRecords: inviteRecords.map(r => ({ id: r.id, inviteeUserId: r.inviteeUserId, inviteeName: null, createdAt: r.createdAt })),
      activityInviteRecords: activityInviteRecords.map(r => ({ id: r.id, activityId: r.activityId, activityTitle: null, inviteeUserId: r.inviteeUserId, inviteeName: null, createdAt: r.createdAt })),
      systemTags: tags.systemTags,
      adminTags: tags.adminTags,
      notes,
    }
  }

  @Patch('users/:userId/type')
  async updateUserType(@Param('userId') userId: string, @Body() body: { identityType: string }) {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) throw new BadRequestException(`User ${userId} not found`)
    const val = (body?.identityType ?? '').trim()
    user.identityType = val || null
    await this.userRepo.save(user)
    return { userId, identityType: user.identityType }
  }

  @Post('users/:userId/tags')
  async addTag(@Param('userId') userId: string, @Body() body: { tag: string; tagId?: string }) {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) throw new BadRequestException('用户不存在')
    let tagDef: TagDefinition | null = null
    if (body?.tagId) tagDef = await this.tagDefRepo.findOne({ where: { id: String(body.tagId) } as any })
    if (!tagDef) {
      const tagVal = (body?.tag || '').trim()
      if (!tagVal) throw new BadRequestException('tag 不能为空')
      if (tagVal.length > 50) throw new BadRequestException('tag 最长 50 字')
      tagDef = await this.tagDefRepo.findOne({ where: { name: tagVal, type: 'CUSTOM' } as any })
      if (!tagDef) tagDef = await this.tagDefRepo.save(this.tagDefRepo.create({ name: tagVal, type: 'CUSTOM', description: null, ruleCode: null, isEnabled: true }))
    }
    if (tagDef.type === 'SYSTEM') throw new BadRequestException('系统标签由系统任务维护，不能手动添加')
    if (tagDef.isEnabled === false) throw new BadRequestException('标签已停用')
    const existing = await this.tagRelationRepo.findOne({ where: { userId, tagId: tagDef.id } as any, relations: ['tag'] })
    if (existing) return { id: existing.id, tag: tagDef.name, name: tagDef.name, type: tagDef.type, source: existing.source }
    const relation = await this.tagRelationRepo.save(this.tagRelationRepo.create({ userId, tagId: tagDef.id, source: 'ADMIN', assignedBy: null }))
    return { id: relation.id, tag: tagDef.name, name: tagDef.name, type: tagDef.type, source: relation.source }
  }

  @Delete('users/:userId/tags/:tagId')
  async deleteTag(@Param('userId') userId: string, @Param('tagId') tagId: string) {
    const relation = await this.tagRelationRepo.findOne({ where: { id: tagId, userId } as any, relations: ['tag'] })
    if (relation) {
      if (relation.source === 'SYSTEM' || relation.tag?.type === 'SYSTEM') throw new BadRequestException('系统标签不允许手动删除')
      await this.tagRelationRepo.remove(relation)
      return { ok: true, deleted: true }
    }
    const legacyTag = await this.legacyTagRepo.findOne({ where: { id: Number(tagId), userId } })
    if (!legacyTag) return { ok: true, deleted: false, reason: 'not found' }
    await this.legacyTagRepo.remove(legacyTag)
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

  private emptyStats() {
    return { registrationCount: 0, checkedInCount: 0, orderCount: 0, paidAmount: 0, refundedAmount: 0 }
  }

  private async buildUserStats(userId: string) {
    const map = await this.buildStatsMap([userId])
    return map.get(userId) || this.emptyStats()
  }

  private async buildStatsMap(userIds: string[]) {
    const result = new Map<string, ReturnType<AdminCrmController['emptyStats']>>()
    for (const userId of userIds) result.set(userId, this.emptyStats())
    if (userIds.length === 0) return result

    const regs = await this.regRepo.find({ where: { userId: In(userIds) } })
    for (const reg of regs) {
      const stats = result.get(reg.userId)
      if (!stats) continue
      stats.registrationCount += 1
      if (reg.status === 'CHECKED_IN') stats.checkedInCount += 1
    }

    const orders = await this.orderRepo.find({ where: { userId: In(userIds) } })
    for (const order of orders) {
      if (!order.userId) continue
      const stats = result.get(order.userId)
      if (!stats) continue
      if (['PAID', 'PARTIAL_REFUND', 'REFUNDED'].includes(order.status)) {
        stats.orderCount += 1
        stats.paidAmount += Number(order.amount || 0)
      }
    }

    const refunds = await this.refundRepo.find({ where: { userId: In(userIds), status: 'SUCCESS' } })
    for (const refund of refunds) {
      if (!refund.userId) continue
      const stats = result.get(refund.userId)
      if (!stats) continue
      stats.refundedAmount += Number(refund.amount || 0)
    }
    return result
  }

  private async buildTagsMap(userIds: string[]) {
    const result = new Map<string, { systemTags: any[]; adminTags: any[] }>()
    for (const userId of userIds) result.set(userId, { systemTags: [], adminTags: [] })
    if (userIds.length === 0) return result

    const relations = await this.tagRelationRepo.find({ where: { userId: In(userIds) } as any, relations: ['tag'], order: { assignedAt: 'DESC' } })
    for (const relation of relations) {
      if (!relation.tag || relation.tag.isEnabled === false) continue
      const tagPayload = {
        id: relation.id,
        tag: relation.tag.name,
        name: relation.tag.name,
        type: relation.tag.type,
        source: relation.source,
        ruleCode: relation.tag.ruleCode,
        description: relation.tag.description,
        updatedAt: relation.assignedAt,
      }
      if (relation.tag.type === 'SYSTEM') result.get(relation.userId)?.systemTags.push(tagPayload)
      else result.get(relation.userId)?.adminTags.push(tagPayload)
    }

    const legacyTags = await this.legacyTagRepo.find({ where: { userId: In(userIds) } as any, order: { createdAt: 'DESC' } })
    for (const legacy of legacyTags) {
      result.get(legacy.userId)?.adminTags.push({ id: legacy.id, tag: legacy.tag, name: legacy.tag, type: 'CUSTOM', source: 'LEGACY', ruleCode: null, description: null, updatedAt: legacy.createdAt })
    }
    return result
  }

  private async getUserTags(userId: string) {
    return (await this.buildTagsMap([userId])).get(userId) || { systemTags: [], adminTags: [] }
  }
}
