import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In, QueryFailedError } from 'typeorm'
import { randomBytes, randomInt, randomUUID } from 'crypto'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { User } from './entities/user.entity'
import { Activity } from '../activity/entities/activity.entity'
import { ActivityRegistration } from '../activity/entities/activity-registration.entity'
import { ActivityRegistrationInfo } from '../activity/entities/activity-registration-info.entity'
import { ActivityOrder } from '../activity/entities/activity-order.entity'
import { ActivityInvoice } from '../activity/entities/activity-invoice.entity'
import { ActivityRefund } from '../activity/entities/activity-refund.entity'
import { CertificateTemplate } from '../certificate/entities/certificate-template.entity'
import { IssuedCertificate } from '../certificate/entities/issued-certificate.entity'
import { UserInvoiceProfile, UserInvoiceType } from './entities/user-invoice-profile.entity'
import { UserRegistrationProfile } from './entities/user-registration-profile.entity'
import { ContentSecurityService } from '../common/content-security.service'
import { MiniappJwtService } from '../auth/miniapp-jwt.service'
import { getWechatLoginMode } from '../config/runtime-config'
import { resolveActivityTemporalState, resolveUserActivityState } from '../activity/user-activity-state'
import { ensureUploadSubDir, toPublicUploadUrl } from '../config/upload-path'
import { CertificateRenderSnapshot, createCertificateRenderSnapshot, renderCertificateSvg } from '../certificate/certificate-renderer'

const MOCK_CODE_MAP: Record<string, string> = {
  'mock-code': 'mock_openid_default',
  'mock-code-001': 'mock_openid_001',
  'mock-code-002': 'mock_openid_002',
  'mock-code-v24-smoke': 'mock_openid_v24_smoke',
}

const USER_ID_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const REGISTRATION_PROFILE_FIELDS = [
  'realName',
  'phone',
  'residentialAddress',
  'departureCity',
  'idCardNo',
  'transportPreference',
  'roomPreference',
  'organization',
  'jobTitle',
  'inviterName',
] as const
type RegistrationProfileField = typeof REGISTRATION_PROFILE_FIELDS[number]
const ID_CARD_RE = /^(?:\d{15}|\d{17}[\dXx])$/

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
    @InjectRepository(ActivityOrder)
    private readonly orderRepo: Repository<ActivityOrder>,
    @InjectRepository(ActivityInvoice)
    private readonly invoiceRepo: Repository<ActivityInvoice>,
    @InjectRepository(ActivityRefund)
    private readonly refundRepo: Repository<ActivityRefund>,
    @InjectRepository(UserInvoiceProfile)
    private readonly invoiceProfileRepo: Repository<UserInvoiceProfile>,
    @InjectRepository(UserRegistrationProfile)
    private readonly registrationProfileRepo: Repository<UserRegistrationProfile>,
    @InjectRepository(CertificateTemplate)
    private readonly certTemplateRepo: Repository<CertificateTemplate>,
    @InjectRepository(IssuedCertificate)
    private readonly issuedCertificateRepo: Repository<IssuedCertificate>,
    private readonly contentSecurity: ContentSecurityService,
    private readonly miniappJwt: MiniappJwtService,
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

  private getWechatAppId(): string {
    return (process.env.WECHAT_APPID || process.env.MINIAPP_APPID || 'mock-app').trim()
  }

  private async resolveRealOpenid(code: string): Promise<{ openid: string; unionid: string | null }> {
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
      return { openid: data.openid as string, unionid: data.unionid || null }
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e
      throw new BadRequestException(`微信 code2session 调用失败: ${e.message}`)
    }
  }

  private createUserId(): string {
    let suffix = ''
    for (let i = 0; i < 12; i += 1) suffix += USER_ID_ALPHABET[randomInt(USER_ID_ALPHABET.length)]
    return `usr_${suffix}`
  }

  private generateToken(userId: string): Promise<string> {
    return this.miniappJwt.issueToken(userId)
  }

  private maskPhone(phone?: string | null): string | null {
    if (!phone) return null
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  }

  private userSummary(user: User) {
    return {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      identityType: user.identityType || '普通用户',
      isMember: user.isMember,
      isLifetimeMember: user.isLifetimeMember,
      phoneMasked: this.maskPhone(user.phone),
      gender: user.gender,
      intro: user.intro || '',
    }
  }

  private userPrivateProfile(user: User, registrationProfile?: UserRegistrationProfile | null) {
    return {
      ...this.userSummary(user),
      phone: registrationProfile?.phone || user.phone,
      birthday: user.birthday,
      birthYearMonth: user.birthYearMonth,
      realName: registrationProfile?.realName || null,
      residentialAddress: registrationProfile?.residentialAddress || null,
      idCardNo: registrationProfile?.idCardNo || null,
      departureCity: registrationProfile?.departureCity || null,
      transportPreference: registrationProfile?.transportPreference || null,
      roomPreference: registrationProfile?.roomPreference || null,
      organization: registrationProfile?.organization || null,
      jobTitle: registrationProfile?.jobTitle || null,
      inviterName: registrationProfile?.inviterName || null,
    }
  }

  // ──── V2.6B: WeChat login ────
  async wechatLogin(body: { code: string; nickname?: string; avatarUrl?: string; gender?: string; phoneCode?: string }) {
    const { code, nickname, avatarUrl, gender } = body
    if (!code) throw new BadRequestException('code is required')

    const wechatAppId = this.getWechatAppId()
    let openid: string
    let unionid: string | null = null

    if (getWechatLoginMode() === 'real') {
      const resolved = await this.resolveRealOpenid(code)
      openid = resolved.openid
      unionid = resolved.unionid
    } else {
      openid = this.resolveMockOpenid(code)
    }

    // The app ID is part of the identity boundary. UnionID is optional metadata only.
    let user = await this.userRepo.findOne({ where: { wechatAppId, openid } })

    let isNewUser = false
    if (!user) {
      isNewUser = true
      const now = new Date()
      for (let attempt = 0; attempt < 5; attempt += 1) {
        user = this.userRepo.create({
          id: this.createUserId(),
          wechatAppId,
          openid,
          unionid,
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
        try {
          await this.userRepo.save(user)
          break
        } catch (error) {
          const driverMessage = String((error as any)?.driverError?.message || (error as any)?.message || '')
          const duplicate = error instanceof QueryFailedError && /unique|duplicate|constraint/i.test(driverMessage)
          if (!duplicate || attempt === 4) throw error
          user = await this.userRepo.findOne({ where: { wechatAppId, openid } })
          if (user) { isNewUser = false; break }
        }
      }
    } else {
      // Update profile fields only if non-empty values are provided
      user.lastLoginAt = new Date()
      if (nickname && nickname.trim()) user.nickname = nickname.trim()
      if (avatarUrl && avatarUrl.trim()) user.avatarUrl = avatarUrl.trim()
      if (gender && gender !== 'unknown') user.gender = gender
      if (unionid && !user.unionid) user.unionid = unionid
      await this.userRepo.save(user)
    }

    if (!user) throw new BadRequestException('用户身份创建失败，请重试')
    const token = await this.generateToken(user.id)

    return {
      userId: user.id,
      token,
      user: this.userSummary(user),
      isNewUser,
    }
  }

  // ──── Get profile ────
  async getProfile(id: string) {
    const user = await this.userRepo.findOne({ where: { id } })
    if (!user) throw new NotFoundException(`User ${id} not found`)
    return this.userSummary(user)
  }

  async getPrivateProfile(id: string) {
    const user = await this.userRepo.findOne({ where: { id } })
    if (!user) throw new NotFoundException(`User ${id} not found`)
    const registrationProfile = await this.registrationProfileRepo.findOne({ where: { userId: id } })
    return this.userPrivateProfile(user, registrationProfile)
  }

  async getRegistrationProfile(userId: string) {
    const user = await this.ensureUser(userId)
    const profile = await this.registrationProfileRepo.findOne({ where: { userId } })
    return {
      userId,
      realName: profile?.realName || null,
      phone: profile?.phone || user.phone || null,
      residentialAddress: profile?.residentialAddress || null,
      idCardNo: profile?.idCardNo || null,
      departureCity: profile?.departureCity || null,
      transportPreference: profile?.transportPreference || null,
      roomPreference: profile?.roomPreference || null,
      organization: profile?.organization || null,
      jobTitle: profile?.jobTitle || null,
      inviterName: profile?.inviterName || null,
      updatedAt: profile?.updatedAt || null,
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

    // Templates are only input. Each eligible user receives a persisted rendered asset.
    const allTemplates = await this.certTemplateRepo.find({ where: { enabled: true } })
    const templateMap = new Map(allTemplates.map(t => [t.id, t]))
    const defaultTemplate = allTemplates.find(t => t.isDefault) || null

    function getTemplate(templateId: number | null): { id: number; name: string; imageUrl: string; fieldConfig: any; updatedAt: Date } | null {
      if (templateId) {
        const t = templateMap.get(templateId)
        if (t) return { id: t.id, name: t.name, imageUrl: t.imageUrl, fieldConfig: parseFieldConfig(t.fieldConfig), updatedAt: t.updatedAt }
      }
      if (defaultTemplate) return { id: defaultTemplate.id, name: defaultTemplate.name, imageUrl: defaultTemplate.imageUrl, fieldConfig: parseFieldConfig(defaultTemplate.fieldConfig), updatedAt: defaultTemplate.updatedAt }
      return null
    }

    function parseFieldConfig(raw: string | null): any {
      if (!raw) return {}
      try { return JSON.parse(raw) } catch { return {} }
    }

    const certificates = await Promise.all(activityAssets.filter(a => a.certificateStatus === 'AVAILABLE').map(async a => {
      const activityTemplate = a.certificateTemplateId || null  // V2.6C: per-activity template
      const template = getTemplate(activityTemplate)
      const issued = await this.ensureIssuedCertificate({
        userId,
        activityId: a.activityId,
        templateId: template?.id || null,
        templateUpdatedAt: template?.updatedAt || null,
        activityTitle: a.title,
        activitySlogan: activityMap.get(a.activityId)?.slogan || '',
        recipientName: regInfoMap.get(a.activityId)?.realName || displayName,
        templateImageUrl: template?.imageUrl || '',
        templateFieldConfig: template?.fieldConfig || {},
        city: a.location || a.city || '',
        activityEndAt: a.endTime || null,
      })
      const snapshot = this.parseIssuedCertificateSnapshot(issued.renderSnapshot)
      return {
        certificateId: issued.id,
        publicToken: issued.publicToken,
        activityId: a.activityId,
        recipientName: snapshot?.fields.recipientName.value || regInfoMap.get(a.activityId)?.realName || displayName,
        activityTitle: snapshot?.fields.activityName.value || a.title,
        activityDescription: activityMap.get(a.activityId)?.description || '',
        activityDate: snapshot?.activityEndAt || a.endTime || null,
        activityEndAt: snapshot?.activityEndAt || a.endTime || null,
        issuerName: '行者学社',
        certificateImage: issued.imageUrl,
        template: snapshot ? { id: snapshot.templateId, imageUrl: snapshot.backgroundImageUrl } : null,
        templateRenderConfig: snapshot?.fields || {},
        certificateFields: snapshot ? Object.fromEntries(Object.entries(snapshot.fields).map(([key, field]) => [key, field.value])) : {},
        province: a.province, city: a.city || a.location || '',
        location: snapshot?.fields.city.value || a.location || '',
        certificateText: '这段路，已成为你的行者印记。',
        certificateNo: `XZ-${a.activityId}-${userId.slice(-4)}`,
        issuedAt: issued.issuedAt,
        friendShareImage: issued.friendShareImageUrl || issued.imageUrl,
        timelineShareImage: issued.timelineShareImageUrl || issued.imageUrl,
        certificateStatus: 'AVAILABLE',
      }
    }))

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

  async getMineSummary(userId: string) {
    await this.ensureUser(userId)
    const [journey, registrations, orders] = await Promise.all([
      this.getJourney(userId),
      this.getMyRegistrations(userId),
      this.orderRepo.find({ where: { userId } }),
    ])
    return {
      journeyCityCount: Number(journey.summary.cityCount) || 0,
      certificateCount: Number(journey.summary.certificateCount) || 0,
      companionCount: Number(journey.summary.companionCount) || 0,
      pendingCheckinCount: Number(registrations.pendingCheckinCount) || 0,
      pendingPaymentCount: orders.filter(order => order.postpayStatus === 'UNPAID' || order.postpayStatus === 'OVERDUE').length,
    }
  }

  async getPublicCertificate(publicToken: string) {
    const issued = await this.issuedCertificateRepo.findOne({ where: { publicToken } })
    if (!issued) throw new NotFoundException('证书不存在或已失效')
    const activity = await this.activityRepo.findOne({ where: { id: issued.activityId } })
    if (!activity) throw new NotFoundException('证书活动不存在')
    const snapshot = this.parseIssuedCertificateSnapshot(issued.renderSnapshot)
    return {
      certificateImage: issued.imageUrl,
      friendShareImage: issued.friendShareImageUrl || issued.imageUrl,
      timelineShareImage: issued.timelineShareImageUrl || issued.imageUrl,
      activityTitle: snapshot?.fields.activityName.value || activity.title,
      activityDescription: activity.description || '',
      location: snapshot?.fields.city.value || activity.locationName || activity.location || '',
      issuedAt: issued.issuedAt,
    }
  }

  private async ensureIssuedCertificate(input: { userId: string; activityId: number; templateId: number | null; templateUpdatedAt: Date | string | null; activityTitle: string; activitySlogan: string; recipientName: string; templateImageUrl: string; templateFieldConfig: Record<string, any>; city: string; activityEndAt: Date | string | null }) {
    const existing = await this.issuedCertificateRepo.findOne({ where: { userId: input.userId, activityId: input.activityId } })
    if (existing) {
      // Issued assets are immutable. Legacy rows only receive an audit snapshot;
      // the persisted image and share assets are never regenerated here.
      if (!existing.renderSnapshot) {
        const snapshot = this.createIssuedCertificateSnapshot(input, existing.issuedAt)
        existing.templateId = snapshot.templateId
        existing.renderSnapshot = JSON.stringify(snapshot)
        return this.issuedCertificateRepo.save(existing)
      }
      return existing
    }

    const id = `cert_${randomUUID().replace(/-/g, '')}`
    const filename = `${id}.svg`
    const imageUrl = toPublicUploadUrl('certificate-issued', filename)
    const issuedAt = input.activityEndAt ? new Date(input.activityEndAt) : new Date()
    const publicToken = randomBytes(24).toString('base64url')
    const snapshot = this.createIssuedCertificateSnapshot(input, issuedAt)
    this.writeIssuedCertificateAsset(id, snapshot)
    const shareImages = this.writeCertificateShareImages(id)
    try {
      return await this.issuedCertificateRepo.save(this.issuedCertificateRepo.create({ id, userId: input.userId, activityId: input.activityId, publicToken, imageUrl, templateId: snapshot.templateId, renderSnapshot: JSON.stringify(snapshot), issuedAt, ...shareImages }))
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const raced = await this.issuedCertificateRepo.findOne({ where: { userId: input.userId, activityId: input.activityId } })
        if (raced) return raced
      }
      throw error
    }
  }

  private createIssuedCertificateSnapshot(input: { templateId: number | null; templateUpdatedAt: Date | string | null; templateImageUrl: string; templateFieldConfig: Record<string, any>; recipientName: string; activityTitle: string; activitySlogan: string; city: string; activityEndAt: Date | string | null }, issuedAt: Date) {
    return createCertificateRenderSnapshot({
      templateId: input.templateId,
      templateUpdatedAt: input.templateUpdatedAt,
      backgroundImageUrl: input.templateImageUrl,
      renderConfig: input.templateFieldConfig,
      recipientName: input.recipientName,
      activityName: input.activityTitle,
      activityLocation: input.city,
      activityEndAt: input.activityEndAt,
      activitySlogan: input.activitySlogan,
      issuedAt,
    })
  }

  private parseIssuedCertificateSnapshot(raw: string | null): CertificateRenderSnapshot | null {
    if (!raw) return null
    try { return JSON.parse(raw) as CertificateRenderSnapshot } catch { return null }
  }

  private writeIssuedCertificateAsset(certificateId: string, snapshot: CertificateRenderSnapshot) {
    writeFileSync(join(ensureUploadSubDir('certificate-issued'), `${certificateId}.svg`), renderCertificateSvg(snapshot), 'utf8')
  }

  private writeCertificateShareImages(certificateId: string) {
    const baseUrl = toPublicUploadUrl('certificate-issued', `${certificateId}.svg`)
    const friendShareImageUrl = toPublicUploadUrl('certificate-issued', `${certificateId}-share-friend.svg`)
    const timelineShareImageUrl = toPublicUploadUrl('certificate-issued', `${certificateId}-share-timeline.svg`)
    const dir = ensureUploadSubDir('certificate-issued')
    const makeCover = (width: number, height: number) => `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#edf5ef"/><path d="M0 ${height * .83} L${width * .26} ${height * .58} L${width * .5} ${height * .78} L${width * .74} ${height * .5} L${width} ${height * .75} V${height} H0Z" fill="#d3e5d9"/><text x="${width / 2}" y="${height * .12}" text-anchor="middle" font-size="${Math.round(width * .045)}" font-family="sans-serif" fill="#2E7D5A">行者学社</text><image href="${baseUrl}" x="${width * .09}" y="${height * .2}" width="${width * .82}" height="${height * .68}" preserveAspectRatio="xMidYMid meet"/></svg>`
    writeFileSync(join(dir, `${certificateId}-share-friend.svg`), makeCover(1250, 1000), 'utf8')
    writeFileSync(join(dir, `${certificateId}-share-timeline.svg`), makeCover(1000, 1000), 'utf8')
    return { friendShareImageUrl, timelineShareImageUrl }
  }

  async getJourneyCities(userId: string) {
    await this.ensureUser(userId)
    const regs = await this.regRepo.find({
      where: { userId, status: 'CHECKED_IN' as any },
      order: { checkedInAt: 'DESC' as any, createdAt: 'DESC' as any },
    })
    const orders = regs.length ? await this.orderRepo.find({ where: { registrationId: In(regs.map((reg) => reg.id)) } }) : []
    const orderByReg = new Map(orders.map((order) => [order.registrationId, order]))
    const activityIds = [...new Set(regs.map(r => r.activityId).filter(Boolean))]
    if (activityIds.length === 0) return []

    const activities = await this.activityRepo.find({ where: { id: In(activityIds) } })
    const cityMap = new Map<string, {
      city: string
      province: string
      cityAdcode: string
      latitude: number | null
      longitude: number | null
      activityCount: number
    }>()

    for (const activity of activities) {
      const rawLatitude = Number(activity.locationLat ?? activity.lat)
      const rawLongitude = Number(activity.locationLng ?? activity.lng)
      const latitude = Number.isFinite(rawLatitude) && rawLatitude >= -90 && rawLatitude <= 90 ? rawLatitude : null
      const longitude = Number.isFinite(rawLongitude) && rawLongitude >= -180 && rawLongitude <= 180 ? rawLongitude : null

      const city = (activity.cityName || activity.city || activity.locationName || '').trim()
      if (!city) continue
      const province = (activity.provinceName || activity.province || '').trim()
      const cityAdcode = (activity.adcode || activity.cityCode || '').trim()
      const key = cityAdcode || `${province}|${city}`
      const current = cityMap.get(key)
      if (current) {
        current.activityCount += 1
      } else {
        cityMap.set(key, { city, province, cityAdcode, latitude, longitude, activityCount: 1 })
      }
    }

    return [...cityMap.values()].sort((a, b) => b.activityCount - a.activityCount || a.city.localeCompare(b.city)).map(city => ({
      cityName: city.city,
      cityAdcode: city.cityAdcode || null,
      checkedInCount: city.activityCount,
      city: city.city,
      province: city.province,
      latitude: city.latitude,
      longitude: city.longitude,
      activityCount: city.activityCount,
    }))
  }

  async getMyOrders(userId: string) {
    await this.ensureUser(userId)
    const orders = await this.orderRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' as any, id: 'DESC' as any },
    })
    const orderIds = orders.map(o => o.id)
    const activityIds = [...new Set(orders.map(o => o.activityId).filter((id): id is number => id != null))]
    const activities = activityIds.length > 0 ? await this.activityRepo.find({ where: { id: In(activityIds) } }) : []
    const invoices = orderIds.length > 0 ? await this.invoiceRepo.find({ where: { orderId: In(orderIds) } }) : []
    const refunds = orderIds.length > 0 ? await this.refundRepo.find({ where: { orderId: In(orderIds), status: 'SUCCESS' } }) : []
    const activityMap = new Map(activities.map(a => [a.id, a]))
    const invoiceMap = new Map<number, ActivityInvoice>()
    for (const invoice of invoices) {
      if (!invoiceMap.has(invoice.orderId)) invoiceMap.set(invoice.orderId, invoice)
    }
    const refundMap = new Map<number, number>()
    for (const refund of refunds) {
      refundMap.set(refund.orderId, (refundMap.get(refund.orderId) || 0) + this.money(refund.amount))
    }

    const items = orders.map(order => {
      const activity = order.activityId != null ? activityMap.get(order.activityId) : null
      const invoice = invoiceMap.get(order.id) || null
      const refundedAmount = Math.max(this.money(order.refundedAmount), refundMap.get(order.id) || 0)
      const paidAmount = this.paidAmount(order)
      const invoiceableAmount = Math.max(0, paidAmount - refundedAmount)
      const hasPendingPostpay = order.payType === 'PREPAY'
        && this.money(order.orderPostpayAmount) > 0
        && order.postpayStatus !== 'PAID'
        && order.postpayStatus !== 'WAIVED'
      const refundStatus = refundedAmount <= 0
        ? 'NONE'
        : refundedAmount >= paidAmount
          ? 'REFUNDED'
          : 'PARTIAL_REFUND'

      return {
        id: order.id,
        orderId: order.id,
        registrationId: order.registrationId,
        activityId: order.activityId,
        activityTitle: activity?.title || '',
        activityCoverUrl: activity?.coverImage || '',
        activityStartTime: activity?.startTime || null,
        activityEndTime: activity?.endTime || null,
        activityLocation: activity?.locationName || activity?.location || '',
        paymentMode: order.payType,
        payType: order.payType,
        orderStatus: order.status,
        paymentStatus: ['PAID', 'PARTIAL_REFUND', 'REFUNDED'].includes(order.status) ? 'PAID' : order.status,
        fullAmount: this.money(order.fullAmount ?? order.amount),
        amount: this.money(order.amount),
        orderPrepayAmount: this.money(order.orderPrepayAmount),
        orderPostpayAmount: this.money(order.orderPostpayAmount),
        paidAmount,
        refundedAmount,
        invoiceableAmount,
        refundStatus,
        postpayStatus: order.postpayStatus || 'NONE',
        postpayDate: activity?.postpayDate || null,
        postpayPaidAt: order.postpayPaidAt,
        invoiceStatus: invoice ? this.userInvoiceStatus(invoice.status) : 'NONE',
        invoiceRequestId: invoice?.id || null,
        canApplyInvoice: !invoice && invoiceableAmount > 0 && !hasPendingPostpay && refundStatus !== 'REFUNDED',
        invoiceBlockedReason: invoice
          ? '该订单已提交过开票申请'
          : hasPendingPostpay
            ? '后付款完成后可申请开票'
            : invoiceableAmount <= 0
              ? '该订单暂无可开票金额'
              : '',
        canRequestRefund: paidAmount - refundedAmount > 0,
        createdAt: order.createdAt,
      }
    })

    return { items, total: items.length }
  }

  async getMyRegistrations(userId: string) {
    await this.ensureUser(userId)
    const regs = await this.regRepo.find({
      where: { userId, status: In(['REGISTERED', 'PAID', 'CHECKED_IN']) },
      order: { createdAt: 'DESC' as any, id: 'DESC' as any },
    })
    const orders = regs.length ? await this.orderRepo.find({ where: { registrationId: In(regs.map((reg) => reg.id)) } }) : []
    const orderByReg = new Map(orders.map((order) => [order.registrationId, order]))
    const now = Date.now()
    const items = regs.map(reg => {
      const activity = reg.activity
      const isCompleted = activity?.endTime ? new Date(activity.endTime).getTime() < now : false
      const isCheckedIn = reg.status === 'CHECKED_IN'
      return {
        registrationId: reg.id,
        activityId: reg.activityId,
        activityTitle: activity?.title || '',
        activityDescription: activity?.description || '',
        activityCoverUrl: activity?.coverImage || '',
        activityStartTime: activity?.startTime || null,
        activityEndTime: activity?.endTime || null,
        activityLocation: activity?.locationName || activity?.location || '',
        province: activity?.province || '',
        city: activity?.city || '',
        userActivityState: resolveUserActivityState({ registrationStatus: reg.status, orderStatus: orderByReg.get(reg.id)?.status }),
        activityTemporalState: resolveActivityTemporalState(activity?.startTime, activity?.endTime),
        registrationStatus: reg.status,
        checkinStatus: isCheckedIn ? 'CHECKED_IN' : 'NOT_CHECKED_IN',
        qrAvailable: reg.status === 'PAID' && !isCheckedIn && !isCompleted,
        isCompleted,
        createdAt: reg.createdAt,
      }
    })
    const pendingCheckinCount = items.filter(i => i.userActivityState === 'PENDING_CHECKIN' && !i.isCompleted).length
    return { items, total: items.length, pendingCheckinCount }
  }

  // ──── Update profile ────
  async updateProfile(id: string, body: {
    nickname?: string | null; avatarUrl?: string | null; gender?: string | null; phone?: string | null
    birthday?: string | null; birthYearMonth?: string | null; identityType?: string; intro?: string | null
    realName?: string | null; residentialAddress?: string | null; idCardNo?: string | null
    departureCity?: string | null; transportPreference?: string | null; roomPreference?: string | null
    organization?: string | null; jobTitle?: string | null; inviterName?: string | null
  }) {
    const user = await this.userRepo.findOne({ where: { id } })
    if (!user) throw new NotFoundException(`User ${id} not found`)

    if (Object.prototype.hasOwnProperty.call(body || {}, 'identityType')) {
      throw new BadRequestException('用户类型不能通过个人资料修改')
    }

    if (body.birthday !== undefined) {
      if (body.birthday !== null && body.birthday !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(body.birthday)) {
        throw new BadRequestException('birthday must be YYYY-MM-DD format')
      }
    }

    if (body.birthYearMonth !== undefined) {
      if (body.birthYearMonth !== null && body.birthYearMonth !== '' && !/^\d{4}-\d{2}$/.test(body.birthYearMonth)) {
        throw new BadRequestException('birthYearMonth must be YYYY-MM format')
      }
    }

    if (body.idCardNo !== undefined) {
      const idCardNo = String(body.idCardNo || '').trim().replace(/x$/, 'X')
      if (idCardNo && !ID_CARD_RE.test(idCardNo)) throw new BadRequestException('请填写正确的身份证号')
      body.idCardNo = idCardNo || null
    }

    const maxLengths: Partial<Record<RegistrationProfileField, number>> = {
      realName: 20,
      phone: 30,
      residentialAddress: 200,
      departureCity: 50,
      idCardNo: 50,
      transportPreference: 50,
      roomPreference: 100,
      organization: 100,
      jobTitle: 100,
      inviterName: 100,
    }
    for (const field of REGISTRATION_PROFILE_FIELDS) {
      if (body[field] === undefined || body[field] === null) continue
      body[field] = String(body[field]).trim() || null
      const limit = maxLengths[field]
      if (limit && String(body[field] || '').length > limit) throw new BadRequestException(`${field} too long`)
    }

    if (body.intro !== undefined && (body.intro || '').trim()) {
      const result = await this.contentSecurity.checkTextSafety({ openid: user.openid, scene: 'profile', content: body.intro || '' })
      if (!result.pass) throw new BadRequestException('签名介绍包含不适合展示的内容，请修改后再保存')
    }

    if (body.nickname !== undefined && (body.nickname || '').trim()) {
      const result = await this.contentSecurity.checkTextSafety({ openid: user.openid, scene: 'profile', content: body.nickname || '' })
      if (!result.pass) throw new BadRequestException('昵称包含不适合展示的内容，请修改后再保存')
    }

    const allowedFields = ['nickname', 'avatarUrl', 'gender', 'phone', 'birthday', 'birthYearMonth', 'intro']
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (user as any)[field] = body[field]
      }
    }

    await this.userRepo.save(user)

    const hasRegistrationProfilePatch = REGISTRATION_PROFILE_FIELDS.some(field => body[field] !== undefined)
    if (hasRegistrationProfilePatch) {
      let registrationProfile = await this.registrationProfileRepo.findOne({ where: { userId: id } })
      if (!registrationProfile) registrationProfile = this.registrationProfileRepo.create({ userId: id })
      for (const field of REGISTRATION_PROFILE_FIELDS) {
        if (body[field] !== undefined) {
          ;(registrationProfile as any)[field] = body[field] ? String(body[field]).trim() : null
        }
      }
      if (body.phone !== undefined) registrationProfile.phone = body.phone ? String(body.phone).trim() : null
      await this.registrationProfileRepo.save(registrationProfile)
    }

    return this.getPrivateProfile(id)
  }

  async getInvoiceProfile(userId: string) {
    await this.ensureUser(userId)
    const profile = await this.invoiceProfileRepo.findOne({ where: { userId } })
    return profile || null
  }

  async saveInvoiceProfile(userId: string, body: {
    invoiceType?: UserInvoiceType
    invoiceTitle?: string
    taxNumber?: string
    companyAddress?: string
    companyPhone?: string
    bankName?: string
    bankAccount?: string
    email?: string
    remark?: string
  }) {
    await this.ensureUser(userId)
    const invoiceType = body.invoiceType === 'COMPANY' ? 'COMPANY' : 'PERSONAL'
    const invoiceTitle = (body.invoiceTitle || '').trim()
    const taxNumber = (body.taxNumber || '').trim()

    if (!invoiceTitle) throw new BadRequestException('请填写发票抬头')
    if (invoiceType === 'COMPANY' && !taxNumber) throw new BadRequestException('企业发票请填写税号')

    let profile = await this.invoiceProfileRepo.findOne({ where: { userId } })
    if (!profile) {
      profile = this.invoiceProfileRepo.create({ userId, invoiceType, invoiceTitle })
    }

    profile.invoiceType = invoiceType
    profile.invoiceTitle = invoiceTitle
    profile.taxNumber = taxNumber || null
    profile.companyAddress = this.cleanText(body.companyAddress)
    profile.companyPhone = this.cleanText(body.companyPhone)
    profile.bankName = this.cleanText(body.bankName)
    profile.bankAccount = this.cleanText(body.bankAccount)
    profile.email = this.cleanText(body.email)
    profile.remark = this.cleanText(body.remark)

    return this.invoiceProfileRepo.save(profile)
  }

  async getInvoiceOrders(userId: string) {
    await this.ensureUser(userId)
    const orders = await this.orderRepo.find({
      where: { userId, status: In(['PAID', 'PARTIAL_REFUND', 'REFUNDED']) },
      order: { createdAt: 'DESC' },
    })
    const activityIds = [...new Set(orders.map(o => o.activityId).filter((id): id is number => id != null))]
    const orderIds = orders.map(o => o.id)
    const activities = activityIds.length > 0 ? await this.activityRepo.find({ where: activityIds.map(id => ({ id } as any)) }) : []
    const invoices = orderIds.length > 0 ? await this.invoiceRepo.find({ where: { orderId: In(orderIds) } }) : []
    const refunds = orderIds.length > 0 ? await this.refundRepo.find({ where: { orderId: In(orderIds), status: 'SUCCESS' } }) : []
    const activityMap = new Map(activities.map(a => [a.id, a]))
    const invoiceMap = new Map(invoices.map(i => [i.orderId, i]))
    const refundMap = new Map<number, number>()
    for (const refund of refunds) {
      refundMap.set(refund.orderId, (refundMap.get(refund.orderId) || 0) + this.money(refund.amount))
    }

    return orders
      .filter(o => this.invoiceableAmount(o, refundMap.get(o.id)) > 0)
      .map(o => {
        const invoice = invoiceMap.get(o.id)
        const hasPendingPostpay = o.payType === 'PREPAY' && Number(o.orderPostpayAmount || 0) > 0 && o.postpayStatus !== 'PAID' && o.postpayStatus !== 'WAIVED'
        const amount = this.invoiceableAmount(o, refundMap.get(o.id))
        return {
          orderId: o.id,
          activityId: o.activityId,
          activityTitle: o.activityId != null ? activityMap.get(o.activityId)?.title || '' : '',
          amount,
          status: o.status,
          payType: o.payType,
          postpayStatus: o.postpayStatus,
          createdAt: o.createdAt,
          existingInvoiceId: invoice?.id || null,
          existingInvoiceStatus: invoice?.status || null,
          canApply: !invoice && !hasPendingPostpay,
          reason: invoice ? '该订单已提交过开票申请' : hasPendingPostpay ? '后付款完成后可申请开票' : '',
        }
      })
  }

  async getInvoiceRequests(userId: string) {
    await this.ensureUser(userId)
    const invoices = await this.invoiceRepo.find({ where: { userId }, order: { createdAt: 'DESC' } })
    const orderIds = [...new Set(invoices.map(i => i.orderId))]
    const activityIds = [...new Set(invoices.map(i => i.activityId).filter((id): id is number => id != null))]
    const orders = orderIds.length > 0 ? await this.orderRepo.find({ where: orderIds.map(id => ({ id } as any)) }) : []
    const activities = activityIds.length > 0 ? await this.activityRepo.find({ where: activityIds.map(id => ({ id } as any)) }) : []
    const orderMap = new Map(orders.map(o => [o.id, o]))
    const activityMap = new Map(activities.map(a => [a.id, a]))

    return invoices.map(i => ({
      id: i.id,
      orderId: i.orderId,
      activityId: i.activityId,
      activityTitle: i.activityId != null ? activityMap.get(i.activityId)?.title || '' : '',
      amount: Number(i.amount || 0),
      invoiceType: i.invoiceType || (i.taxNo ? 'COMPANY' : 'PERSONAL'),
      invoiceTitle: i.title,
      taxNumber: i.taxNo || '',
      status: i.status,
      createdAt: i.createdAt,
      issuedAt: i.issuedAt,
      orderStatus: orderMap.get(i.orderId)?.status || null,
    }))
  }

  async createInvoiceRequest(userId: string, orderId: number) {
    await this.ensureUser(userId)
    const profile = await this.invoiceProfileRepo.findOne({ where: { userId } })
    if (!profile) throw new BadRequestException('请先完善默认开票信息')
    if (profile.invoiceType === 'COMPANY' && !profile.taxNumber) throw new BadRequestException('企业发票请填写税号')

    const order = await this.orderRepo.findOne({ where: { id: orderId } })
    if (!order || order.userId !== userId) throw new NotFoundException(`Order ${orderId} not found`)
    if (!['PAID', 'PARTIAL_REFUND', 'REFUNDED'].includes(order.status)) {
      throw new BadRequestException('该订单暂不可申请开票')
    }

    const existing = await this.invoiceRepo.findOne({ where: { orderId } })
    if (existing) throw new BadRequestException('该订单已提交过开票申请')

    if (order.payType === 'PREPAY' && Number(order.orderPostpayAmount || 0) > 0 && order.postpayStatus !== 'PAID' && order.postpayStatus !== 'WAIVED') {
      throw new BadRequestException('后付款完成后可申请开票')
    }

    const refundedAmount = await this.successfulRefundTotal(orderId)
    const amount = this.invoiceableAmount(order, refundedAmount)
    if (amount <= 0) throw new BadRequestException('该订单暂无可开票金额')

    const invoice = this.invoiceRepo.create({
      orderId,
      userId,
      activityId: order.activityId,
      title: profile.invoiceTitle,
      taxNo: profile.taxNumber || null,
      invoiceType: profile.invoiceType,
      companyAddress: profile.companyAddress,
      companyPhone: profile.companyPhone,
      bankName: profile.bankName,
      bankAccount: profile.bankAccount,
      email: profile.email,
      remark: profile.remark,
      amount,
      status: 'REQUESTED',
    })

    return this.invoiceRepo.save(invoice)
  }

  private money(value: unknown): number {
    const n = Number(value ?? 0)
    return Number.isFinite(n) ? n : 0
  }

  private paidAmount(order: ActivityOrder): number {
    if (order.payType === 'PREPAY') {
      const prepay = this.money(order.orderPrepayAmount ?? order.amount)
      const postpay = order.postpayStatus === 'PAID' ? this.money(order.orderPostpayAmount) : 0
      return prepay + postpay
    }
    return this.money(order.amount)
  }

  private invoiceableAmount(order: ActivityOrder, refundedAmount = this.money(order.refundedAmount)): number {
    return Math.max(0, this.paidAmount(order) - refundedAmount)
  }

  private async successfulRefundTotal(orderId: number): Promise<number> {
    const refunds = await this.refundRepo.find({ where: { orderId, status: 'SUCCESS' } })
    return refunds.reduce((sum, refund) => sum + this.money(refund.amount), 0)
  }

  private userInvoiceStatus(status?: string | null): string {
    if (status === 'REQUESTED') return 'PENDING'
    if (status === 'ISSUED') return 'ISSUED'
    if (status === 'REFUNDED') return 'REFUNDED'
    return status || 'NONE'
  }

  private async ensureUser(userId: string) {
    if (!userId) throw new BadRequestException('userId is required')
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundException(`User ${userId} not found`)
    return user
  }

  private cleanText(value?: string | null): string | null {
    const v = (value || '').trim()
    return v || null
  }
}
