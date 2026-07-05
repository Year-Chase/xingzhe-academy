import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { randomUUID } from 'crypto'
import { User } from './entities/user.entity'
import { Activity } from '../activity/entities/activity.entity'
import { ActivityRegistration } from '../activity/entities/activity-registration.entity'
import { ActivityRegistrationInfo } from '../activity/entities/activity-registration-info.entity'
import { CertificateTemplate } from '../certificate/entities/certificate-template.entity'

const MOCK_CODE_MAP: Record<string, string> = {
  'mock-code': 'mock_openid_default',
  'mock-code-001': 'mock_openid_001',
  'mock-code-002': 'mock_openid_002',
  'mock-code-v24-smoke': 'mock_openid_v24_smoke',
}

// ── V2.6B: mock/real mode ──
const LOGIN_MODE = process.env.WECHAT_LOGIN_MODE || 'mock'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(ActivityRegistration)
    private readonly regRepo: Repository<ActivityRegistration>,
    @InjectRepository(ActivityRegistrationInfo)
    private readonly regInfoRepo: Repository<ActivityRegistrationInfo>,
    @InjectRepository(CertificateTemplate)
    private readonly certTemplateRepo: Repository<CertificateTemplate>,
  ) {}

  // ──── Openid resolution ────
  private resolveMockOpenid(code: string): string {
    // V2.6B: For mock mode, always use a stable openid.
    // Taro.login code changes every call; using it as openid causes new user every login.
    // Use a fixed dev openid for local development.
    // Specific mock codes still map to their preset values.
    if (MOCK_CODE_MAP[code]) return MOCK_CODE_MAP[code]
    // Use a stable mock openid for dev — not derived from the changing code
    return 'mock_openid_dev'
  }

  private async resolveRealOpenid(code: string): Promise<string> {
    const appId = process.env.WECHAT_APPID
    const secret = process.env.WECHAT_SECRET
    if (!appId || !secret) {
      throw new BadRequestException('WECHAT_APPID/WECHAT_SECRET not configured for real login mode')
    }
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`
    try {
      const resp = await fetch(url)
      const data = await resp.json() as any
      if (data.errcode) {
        throw new BadRequestException(`微信登录失败: ${data.errmsg || '未知错误'}`)
      }
      return data.openid as string
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e
      throw new BadRequestException(`微信 code2session 调用失败: ${e.message}`)
    }
  }

  // ──── Generate a simple session token ────
  private generateToken(userId: string): string {
    return `xztok_${randomUUID().replace(/-/g, '')}_${userId.slice(0, 12)}`
  }

  // ──── V2.6B: WeChat login ────
  async wechatLogin(body: { code: string; nickname?: string; avatarUrl?: string; gender?: string; phoneCode?: string }) {
    const { code, nickname, avatarUrl, gender } = body
    if (!code) throw new BadRequestException('code is required')

    let openid: string

    if (LOGIN_MODE === 'real') {
      openid = await this.resolveRealOpenid(code)
    } else {
      openid = this.resolveMockOpenid(code)
    }

    // Find existing user by openid — V2.6B: stable openid ensures same user
    let user = await this.userRepo.findOne({ where: { openid } })

    if (!user) {
      const id = `user_${randomUUID()}`
      const now = new Date()
      user = this.userRepo.create({
        id,
        openid,
        nickname: nickname || null,
        avatarUrl: avatarUrl || null,
        gender: gender || null,
        identityType: '普通用户',
        registeredAt: now,
        lastLoginAt: now,
        status: 'ACTIVE',
        isMember: false,
        isLifetimeMember: false,
      })
      await this.userRepo.save(user)
    } else {
      // Update profile fields only if non-empty values are provided
      user.lastLoginAt = new Date()
      if (nickname && nickname.trim()) user.nickname = nickname.trim()
      if (avatarUrl && avatarUrl.trim()) user.avatarUrl = avatarUrl.trim()
      if (gender && gender !== 'unknown') user.gender = gender
      await this.userRepo.save(user)
    }

    const token = this.generateToken(user.id)

    return {
      userId: user.id,
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        gender: user.gender,
        phone: user.phone,
        phoneMasked: user.phone ? user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null,
        birthYearMonth: user.birthYearMonth,
        identityType: user.identityType || '普通用户',
        intro: user.intro || '',
        isMember: user.isMember,
        isLifetimeMember: user.isLifetimeMember,
        registeredAt: user.registeredAt,
        lastLoginAt: user.lastLoginAt,
      },
    }
  }

  // ──── Get profile ────
  async getProfile(id: string) {
    const user = await this.userRepo.findOne({ where: { id } })
    if (!user) throw new NotFoundException(`User ${id} not found`)
    return {
      id: user.id,
      openid: user.openid,
      unionid: user.unionid,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      gender: user.gender,
      phone: user.phone,
      birthday: user.birthday,
      birthYearMonth: user.birthYearMonth,
      identityType: user.identityType || '普通用户',
      intro: user.intro || '',
      isMember: user.isMember,
      isLifetimeMember: user.isLifetimeMember,
      registeredAt: user.registeredAt,
      lastLoginAt: user.lastLoginAt,
      status: user.status,
    }
  }

  // ──── Get journey ────
  async getJourney(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    const displayName = user?.nickname || '行者'
    const now = Date.now()
    const joinedDays = user?.registeredAt
      ? Math.max(1, Math.floor((now - new Date(user.registeredAt).getTime()) / 86400000))
      : 1

    const regs = await this.regRepo.find({ where: { userId }, order: { createdAt: 'DESC' as any } })
    const activityIds = [...new Set(regs.map(r => r.activityId))]
    const activities = activityIds.length > 0
      ? await this.activityRepo.find({ where: { id: In(activityIds) } })
      : []
    const activityMap = new Map(activities.map(a => [a.id, a]))

    const checkedInCount = regs.filter(r => r.status === 'CHECKED_IN').length
    const completedRegs = regs.filter(r => {
      const a = activityMap.get(r.activityId)
      return a?.endTime ? new Date(a.endTime).getTime() < now : false
    })
    const completedCount = completedRegs.length

    const companionSet = new Set<string>()
    for (const aid of activityIds) {
      const allRegs = await this.regRepo.find({ where: { activityId: aid, status: In(['PAID', 'CHECKED_IN']) } })
      allRegs.forEach(r => { if (r.userId !== userId) companionSet.add(r.userId) })
    }

    const provinceMap = new Map<string, { count: number; completed: number }>()
    const citySet = new Set<string>()
    for (const reg of regs) {
      const a = activityMap.get(reg.activityId)
      if (!a) continue
      const prov = a.province || '未知'
      if (!provinceMap.has(prov)) provinceMap.set(prov, { count: 0, completed: 0 })
      const p = provinceMap.get(prov)!
      p.count++
      if (a.endTime && new Date(a.endTime).getTime() < now) p.completed++
      if (a.city) citySet.add(a.city)
    }
    const provinces = [...provinceMap.entries()].map(([province, data]) => ({
      province, activityCount: data.count, completedCount: data.completed, lit: true,
    }))

    const activityAssets = regs.map(r => {
      const a = activityMap.get(r.activityId)
      const isCompleted = a?.endTime ? new Date(a.endTime).getTime() < now : false
      const hasMemory = !!(a?.memoryImages || a?.memoryText)
      return {
        activityId: r.activityId, registrationId: r.id,
        title: a?.title || '', slogan: a?.slogan || '', coverImage: a?.coverImage || '',
        province: a?.province || '', city: a?.city || '', location: a?.location || '',
        certificateTemplateId: a?.certificateTemplateId || null,
        startTime: a?.startTime || null, endTime: a?.endTime || null,
        isCompleted, isCheckedIn: r.status === 'CHECKED_IN', hasMemory,
        memoryImages: a?.memoryImages || null, memoryText: a?.memoryText || null,
        companionCount: 0, certificateStatus: isCompleted ? 'AVAILABLE' : 'LOCKED',
      }
    })

    for (const item of activityAssets) {
      const allRegs = await this.regRepo.find({ where: { activityId: item.activityId, status: In(['PAID', 'CHECKED_IN']) } })
      item.companionCount = Math.max(0, allRegs.length - 1)
    }

    const memories = activityAssets.filter(a => a.isCompleted && a.hasMemory).map(a => ({
      activityId: a.activityId, title: a.title, province: a.province, city: a.city,
      memoryImages: a.memoryImages, memoryText: a.memoryText, coverImage: a.coverImage,
    }))

    const regInfo = await this.regInfoRepo.find({ where: { userId } })
    const regInfoMap = new Map(regInfo.map(r => [r.activityId, r]))
    const recipientName = regInfo.length > 0 ? (regInfo.find(r => r.realName)?.realName || displayName) : displayName

    // V2.6C: Certificate image from certificate template, NOT from memoryImages
    // Pre-fetch all enabled templates + build lookup map
    const allTemplates = await this.certTemplateRepo.find({ where: { enabled: true } })
    const templateMap = new Map(allTemplates.map(t => [t.id, t]))
    const defaultTemplate = allTemplates.find(t => t.isDefault) || null

    function getTemplate(templateId: number | null): { id: number; name: string; imageUrl: string; fieldConfig: any } | null {
      if (templateId) {
        const t = templateMap.get(templateId)
        if (t) return { id: t.id, name: t.name, imageUrl: t.imageUrl, fieldConfig: parseFieldConfig(t.fieldConfig) }
      }
      if (defaultTemplate) return { id: defaultTemplate.id, name: defaultTemplate.name, imageUrl: defaultTemplate.imageUrl, fieldConfig: parseFieldConfig(defaultTemplate.fieldConfig) }
      return null
    }

    function parseFieldConfig(raw: string | null): any {
      if (!raw) return {}
      try { return JSON.parse(raw) } catch { return {} }
    }

    const certificates = activityAssets.filter(a => a.certificateStatus === 'AVAILABLE').map(a => {
      const activityTemplate = a.certificateTemplateId || null  // V2.6C: per-activity template
      const template = getTemplate(activityTemplate)
      return {
        certificateId: `cert_${a.activityId}_${userId}`,
        activityId: a.activityId,
        recipientName: regInfoMap.get(a.activityId)?.realName || displayName,
        activityTitle: a.title, activityDate: a.startTime || a.endTime,
        issuerName: '行者学社',
        certificateImage: template?.imageUrl || '',  // from template, NOT memoryImages
        template,
        province: a.province, city: a.city || a.location || '',
        certificateText: '这段路，已成为你的行者印记。',
        certificateNo: `XZ-${a.activityId}-${userId.slice(-4)}`,
        issuedAt: a.endTime || a.startTime || new Date().toISOString(),
        certificateStatus: 'AVAILABLE',
      }
    })

    return {
      userId,
      profile: { displayName, avatarUrl: user?.avatarUrl || '', joinedDays },
      summary: {
        registeredCount: regs.length, completedCount, checkedInCount,
        provinceCount: provinces.length, cityCount: citySet.size,
        companionCount: companionSet.size, certificateCount: certificates.length,
      },
      provinces, cities: [...citySet].map(c => ({ city: c })),
      activities: activityAssets, memories, certificates,
    }
  }

  // ──── Update profile ────
  async updateProfile(id: string, body: { nickname?: string; avatarUrl?: string; gender?: string; phone?: string; birthday?: string; birthYearMonth?: string; identityType?: string; intro?: string }) {
    const user = await this.userRepo.findOne({ where: { id } })
    if (!user) throw new NotFoundException(`User ${id} not found`)

    if (body.birthYearMonth !== undefined) {
      if (body.birthYearMonth !== null && body.birthYearMonth !== '' && !/^\d{4}-\d{2}$/.test(body.birthYearMonth)) {
        throw new BadRequestException('birthYearMonth must be YYYY-MM format')
      }
    }

    const allowedFields = ['nickname', 'avatarUrl', 'gender', 'phone', 'birthday', 'birthYearMonth', 'identityType', 'intro']
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (user as any)[field] = body[field]
      }
    }

    await this.userRepo.save(user)
    return this.getProfile(id)
  }
}
