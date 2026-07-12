import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { randomUUID } from 'crypto'
import { User } from './entities/user.entity'
import { Activity } from '../activity/entities/activity.entity'
import { ActivityRegistration } from '../activity/entities/activity-registration.entity'
import { ActivityRegistrationInfo } from '../activity/entities/activity-registration-info.entity'
import { ActivityOrder } from '../activity/entities/activity-order.entity'
import { ActivityInvoice } from '../activity/entities/activity-invoice.entity'
import { ActivityRefund } from '../activity/entities/activity-refund.entity'
import { CertificateTemplate } from '../certificate/entities/certificate-template.entity'
import { UserInvoiceProfile, UserInvoiceType } from './entities/user-invoice-profile.entity'
import { UserRegistrationProfile } from './entities/user-registration-profile.entity'
import { ContentSecurityService } from '../common/content-security.service'

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
    private readonly contentSecurity: ContentSecurityService,
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

  private userPrivateProfile(user: User) {
    return {
      ...this.userSummary(user),
      phone: user.phone,
      birthday: user.birthday,
      birthYearMonth: user.birthYearMonth,
    }
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

    let isNewUser = false
    if (!user) {
      isNewUser = true
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
    return this.userPrivateProfile(user)
  }

  async getRegistrationProfile(userId: string) {
    const user = await this.ensureUser(userId)
    const profile = await this.registrationProfileRepo.findOne({ where: { userId } })
    return {
      userId,
      realName: profile?.realName || null,
      phone: profile?.phone || user.phone || null,
      idCardNo: profile?.idCardNo || null,
      departureCity: profile?.departureCity || null,
      transportPreference: profile?.transportPreference || null,
      roomPreference: profile?.roomPreference || null,
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
    const now = Date.now()
    const items = regs.map(reg => {
      const activity = reg.activity
      const isCompleted = activity?.endTime ? new Date(activity.endTime).getTime() < now : false
      const isCheckedIn = reg.status === 'CHECKED_IN'
      return {
        registrationId: reg.id,
        activityId: reg.activityId,
        activityTitle: activity?.title || '',
        activityCoverUrl: activity?.coverImage || '',
        activityStartTime: activity?.startTime || null,
        activityEndTime: activity?.endTime || null,
        activityLocation: activity?.locationName || activity?.location || '',
        province: activity?.province || '',
        city: activity?.city || '',
        registrationStatus: reg.status,
        checkinStatus: isCheckedIn ? 'CHECKED_IN' : 'NOT_CHECKED_IN',
        qrAvailable: reg.status === 'PAID' && !isCheckedIn && !isCompleted,
        isCompleted,
        createdAt: reg.createdAt,
      }
    })
    const pendingCheckinCount = items.filter(i => i.registrationStatus === 'PAID' && i.checkinStatus !== 'CHECKED_IN' && !i.isCompleted).length
    return { items, total: items.length, pendingCheckinCount }
  }

  // ──── Update profile ────
  async updateProfile(id: string, body: { nickname?: string; avatarUrl?: string; gender?: string; phone?: string; birthday?: string; birthYearMonth?: string; identityType?: string; intro?: string }) {
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
