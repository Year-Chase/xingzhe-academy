import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { randomUUID } from 'crypto'
import { User } from './entities/user.entity'

const MOCK_CODE_MAP: Record<string, string> = {
  'mock-code': 'mock_openid_default',
  'mock-code-001': 'mock_openid_001',
  'mock-code-002': 'mock_openid_002',
  'mock-code-v24-smoke': 'mock_openid_v24_smoke',
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ──── Mock openid resolution ────
  private resolveOpenid(code: string): string | null {
    // 1. Exact match in mock map
    if (MOCK_CODE_MAP[code]) return MOCK_CODE_MAP[code]

    // 2. Any code starting with "mock-code" gets a derived openid
    if (code.startsWith('mock-code')) {
      const suffix = code.replace(/[^a-zA-Z0-9_-]/g, '_')
      return `mock_openid_${suffix}`
    }

    // 3. Not a mock code — real WeChat flow (reserved, not implemented yet)
    return null
  }

  // ──── WeChat login ────
  async wechatLogin(body: { code: string; nickname?: string; avatarUrl?: string; gender?: string }) {
    const { code, nickname, avatarUrl, gender } = body
    if (!code) throw new BadRequestException('code is required')

    const openid = this.resolveOpenid(code)
    if (!openid) {
      throw new BadRequestException('Real WeChat login not yet supported. Use a mock-code for local dev.')
    }

    // Find existing user by openid
    let user = await this.userRepo.findOne({ where: { openid } })

    if (!user) {
      // Create new user
      const id = `user_${randomUUID()}`
      const now = new Date()
      user = this.userRepo.create({
        id,
        openid,
        nickname: nickname || null,
        avatarUrl: avatarUrl || null,
        gender: gender || null,
        registeredAt: now,
        lastLoginAt: now,
        status: 'ACTIVE',
        isMember: false,
        isLifetimeMember: false,
      })
      await this.userRepo.save(user)
    } else {
      // Update lastLoginAt and optional profile fields
      user.lastLoginAt = new Date()
      if (nickname !== undefined) user.nickname = nickname
      if (avatarUrl !== undefined) user.avatarUrl = avatarUrl
      if (gender !== undefined) user.gender = gender
      await this.userRepo.save(user)
    }

    return {
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        gender: user.gender,
        phone: user.phone,
        birthYearMonth: user.birthYearMonth,
        identityType: user.identityType,
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
      identityType: user.identityType,
      isMember: user.isMember,
      isLifetimeMember: user.isLifetimeMember,
      registeredAt: user.registeredAt,
      lastLoginAt: user.lastLoginAt,
      status: user.status,
    }
  }

  // ──── Update profile ────
  async updateProfile(id: string, body: { nickname?: string; avatarUrl?: string; gender?: string; phone?: string; birthday?: string; birthYearMonth?: string; identityType?: string }) {
    const user = await this.userRepo.findOne({ where: { id } })
    if (!user) throw new NotFoundException(`User ${id} not found`)

    // birthYearMonth validation
    if (body.birthYearMonth !== undefined) {
      if (body.birthYearMonth !== null && body.birthYearMonth !== '' && !/^\d{4}-\d{2}$/.test(body.birthYearMonth)) {
        throw new BadRequestException('birthYearMonth must be YYYY-MM format')
      }
    }

    const allowedFields = ['nickname', 'avatarUrl', 'gender', 'phone', 'birthday', 'birthYearMonth', 'identityType']
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (user as any)[field] = body[field]
      }
    }

    await this.userRepo.save(user)
    return this.getProfile(id)
  }
}
