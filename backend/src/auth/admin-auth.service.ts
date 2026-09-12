import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto'
import { promisify } from 'util'
import { Repository } from 'typeorm'
import { AdminUser } from './entities/admin-user.entity'

const scrypt = promisify(scryptCallback)
const PASSWORD_MIN_LENGTH = 8

@Injectable()
export class AdminAuthService {
  constructor(@InjectRepository(AdminUser) private readonly admins: Repository<AdminUser>) {}

  async authenticate(username: string, password: string): Promise<AdminUser> {
    const admin = await this.admins.findOne({ where: { username: String(username || '').trim() } })
    if (!admin || !(await this.verifyPassword(password, admin.passwordHash))) {
      throw new UnauthorizedException('账号或密码错误')
    }
    if (admin.status !== 'ACTIVE') throw new ForbiddenException('账号已停用')
    admin.lastLoginAt = new Date()
    await this.admins.save(admin)
    return admin
  }

  async getActiveAdmin(id: string): Promise<AdminUser> {
    const admin = await this.admins.findOne({ where: { id } })
    if (!admin || admin.status !== 'ACTIVE') throw new UnauthorizedException('账号不可用，请重新登录')
    return admin
  }

  async changeInitialPassword(admin: AdminUser, nextPassword: string, confirmPassword: string): Promise<AdminUser> {
    if (!admin.mustChangePassword) throw new BadRequestException('当前账号无需首次修改密码')
    await this.validateNewPassword(admin, nextPassword, confirmPassword)
    admin.passwordHash = await this.hashPassword(nextPassword)
    admin.mustChangePassword = false
    return this.admins.save(admin)
  }

  async changeOwnPassword(admin: AdminUser, currentPassword: string, nextPassword: string, confirmPassword: string): Promise<AdminUser> {
    if (!(await this.verifyPassword(currentPassword, admin.passwordHash))) throw new UnauthorizedException('当前密码错误')
    await this.validateNewPassword(admin, nextPassword, confirmPassword)
    admin.passwordHash = await this.hashPassword(nextPassword)
    return this.admins.save(admin)
  }

  async listVisibleAdmins(): Promise<Array<Pick<AdminUser, 'id' | 'username' | 'role' | 'status' | 'lastLoginAt' | 'createdAt'>>> {
    return this.admins.find({
      where: { isSystemAccount: false },
      select: ['id', 'username', 'role', 'status', 'lastLoginAt', 'createdAt'],
      order: { createdAt: 'DESC' },
    })
  }

  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16)
    const hash = await scrypt(password, salt, 64) as Buffer
    return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`
  }

  async verifyPassword(password: string, encoded: string): Promise<boolean> {
    const [scheme, saltBase64, hashBase64] = String(encoded || '').split('$')
    if (scheme !== 'scrypt' || !saltBase64 || !hashBase64) return false
    const actual = await scrypt(password, Buffer.from(saltBase64, 'base64'), 64) as Buffer
    const expected = Buffer.from(hashBase64, 'base64')
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  }

  private async validateNewPassword(admin: AdminUser, nextPassword: string, confirmPassword: string) {
    if (!nextPassword || nextPassword.length < PASSWORD_MIN_LENGTH) throw new BadRequestException(`新密码至少需要 ${PASSWORD_MIN_LENGTH} 位`)
    if (nextPassword !== confirmPassword) throw new BadRequestException('两次输入的新密码不一致')
    if (await this.verifyPassword(nextPassword, admin.passwordHash)) throw new BadRequestException('新密码不能与当前密码相同')
  }
}
