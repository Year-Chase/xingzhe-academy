import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../../users/entities/user.entity'
import { ActivityRegistration } from '../entities/activity-registration.entity'
import { ActivityOrder } from '../entities/activity-order.entity'
import { UserInviteRecord } from '../entities/user-invite-record.entity'
import { ActivityInviteRecord } from '../entities/activity-invite-record.entity'
import { TagDefinition } from '../entities/tag-definition.entity'
import { UserTagRelation } from '../entities/user-tag-relation.entity'

const SYSTEM_TAGS = [
  { name: '新用户', ruleCode: 'NEW_USER', description: '注册时间 <= 30 天' },
  { name: '高频参与', ruleCode: 'FREQUENT_CHECKIN', description: '过去 180 天签到活动次数 >= 3' },
  { name: '沉睡用户', ruleCode: 'DORMANT_USER', description: '过去 180 天没有报名活动' },
  { name: '高价值用户', ruleCode: 'HIGH_VALUE_USER', description: '累计支付金额 >= 50000 元' },
  { name: '邀请之星', ruleCode: 'INVITE_STAR', description: '累计邀请成功参与活动用户数 >= 5' },
] as const

@Injectable()
export class SystemTagRefreshJob implements OnModuleInit {
  private timer: NodeJS.Timeout | null = null

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ActivityRegistration)
    private readonly regRepo: Repository<ActivityRegistration>,
    @InjectRepository(ActivityOrder)
    private readonly orderRepo: Repository<ActivityOrder>,
    @InjectRepository(UserInviteRecord)
    private readonly inviteRepo: Repository<UserInviteRecord>,
    @InjectRepository(ActivityInviteRecord)
    private readonly activityInviteRepo: Repository<ActivityInviteRecord>,
    @InjectRepository(TagDefinition)
    private readonly tagRepo: Repository<TagDefinition>,
    @InjectRepository(UserTagRelation)
    private readonly relationRepo: Repository<UserTagRelation>,
  ) {}

  onModuleInit() {
    void this.refresh().catch(() => undefined)
    this.scheduleNextRun()
  }

  async refresh() {
    const tagMap = await this.ensureSystemTags()
    const users = await this.userRepo.find()
    const userIds = users.map((u) => u.id).filter(Boolean)
    const now = new Date()
    const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const day180 = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)

    const targets = new Map<string, Set<string>>()
    for (const tag of SYSTEM_TAGS) targets.set(tag.ruleCode, new Set())

    for (const user of users) {
      const registeredAt = user.registeredAt || user.createdAt
      if (registeredAt && new Date(registeredAt) >= day30) targets.get('NEW_USER')!.add(user.id)
    }

    const recentRegs = await this.regRepo.find()
    const recentRegMap = new Map<string, number>()
    const checkinMap = new Map<string, number>()
    for (const reg of recentRegs) {
      if (!reg.userId) continue
      if (reg.createdAt && new Date(reg.createdAt) >= day180) recentRegMap.set(reg.userId, (recentRegMap.get(reg.userId) || 0) + 1)
      if (reg.status === 'CHECKED_IN' && reg.createdAt && new Date(reg.createdAt) >= day180) checkinMap.set(reg.userId, (checkinMap.get(reg.userId) || 0) + 1)
    }
    for (const [uid, count] of checkinMap) if (count >= 3) targets.get('FREQUENT_CHECKIN')!.add(uid)
    for (const uid of userIds) if ((recentRegMap.get(uid) || 0) === 0) targets.get('DORMANT_USER')!.add(uid)

    const paidOrders = await this.orderRepo.find({ where: { status: 'PAID' } })
    const paidMap = new Map<string, number>()
    for (const order of paidOrders) {
      if (!order.userId) continue
      paidMap.set(order.userId, (paidMap.get(order.userId) || 0) + Number(order.amount || 0))
    }
    for (const [uid, amount] of paidMap) if (amount >= 50000) targets.get('HIGH_VALUE_USER')!.add(uid)

    const inviteRecords = await this.inviteRepo.find()
    const activityInvites = await this.activityInviteRepo.find()
    const invitedByInviter = new Map<string, Set<string>>()
    for (const row of [...inviteRecords, ...activityInvites]) {
      if (!row.inviterUserId || !row.inviteeUserId) continue
      if (!invitedByInviter.has(row.inviterUserId)) invitedByInviter.set(row.inviterUserId, new Set())
      invitedByInviter.get(row.inviterUserId)!.add(row.inviteeUserId)
    }
    const successfulInvitees = new Set(recentRegs.map((r) => r.userId).filter(Boolean))
    for (const [inviter, invitees] of invitedByInviter) {
      let count = 0
      for (const invitee of invitees) if (successfulInvitees.has(invitee)) count += 1
      if (count >= 5) targets.get('INVITE_STAR')!.add(inviter)
    }

    for (const tag of SYSTEM_TAGS) {
      const definition = tagMap.get(tag.ruleCode)!
      await this.syncSystemRelations(definition.id, targets.get(tag.ruleCode)!)
    }
  }

  private async ensureSystemTags() {
    const result = new Map<string, TagDefinition>()
    for (const item of SYSTEM_TAGS) {
      let tag = await this.tagRepo.findOne({ where: { ruleCode: item.ruleCode, type: 'SYSTEM' } as any })
      if (!tag) {
        tag = await this.tagRepo.save(this.tagRepo.create({ ...item, type: 'SYSTEM', isEnabled: true }))
      } else {
        tag.name = item.name
        tag.description = item.description
        tag.isEnabled = tag.isEnabled !== false
        await this.tagRepo.save(tag)
      }
      result.set(item.ruleCode, tag)
    }
    return result
  }

  private async syncSystemRelations(tagId: string, targetUserIds: Set<string>) {
    const existing = await this.relationRepo.find({ where: { tagId, source: 'SYSTEM' } as any })
    const existingUserIds = new Set(existing.map((r) => r.userId))
    for (const userId of targetUserIds) {
      if (!existingUserIds.has(userId)) await this.relationRepo.save(this.relationRepo.create({ userId, tagId, source: 'SYSTEM', assignedBy: null }))
    }
    const stale = existing.filter((r) => !targetUserIds.has(r.userId))
    if (stale.length > 0) await this.relationRepo.remove(stale)
  }

  private scheduleNextRun() {
    if (this.timer) clearTimeout(this.timer)
    const now = new Date()
    const next = new Date(now)
    next.setHours(24, 0, 0, 0)
    const delay = Math.max(60 * 1000, next.getTime() - now.getTime())
    this.timer = setTimeout(async () => {
      try { await this.refresh() } catch {}
      this.scheduleNextRun()
    }, delay)
  }
}
