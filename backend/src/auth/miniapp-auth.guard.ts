import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { MiniappJwtService } from './miniapp-jwt.service'
import { User } from '../users/entities/user.entity'

export type MiniappRequestUser = {
  userId: string
  tokenType: 'miniapp'
}

@Injectable()
export class MiniappAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: MiniappJwtService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers?.authorization || request.headers?.Authorization || ''
    if (!authHeader || !authHeader.startsWith('Bearer ')) throw new UnauthorizedException('请先完成登录')
    const payload = await this.jwt.verifyToken(authHeader.slice('Bearer '.length).trim())
    const user = await this.userRepo.findOne({ where: { id: payload.sub } })
    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException('请先完成登录')
    this.assertLegacyUserHintsMatch(request, user.id)
    request.user = { userId: user.id, tokenType: 'miniapp' } satisfies MiniappRequestUser
    return true
  }

  private assertLegacyUserHintsMatch(request: any, userId: string) {
    const candidates = [
      request.headers?.['x-user-id'],
      request.headers?.['X-User-Id'],
      request.query?.userId,
      request.body?.userId,
    ].filter((value) => value !== undefined && value !== null && String(value).trim() !== '')
    for (const value of candidates) {
      if (String(value).trim() !== userId) throw new ForbiddenException('不能访问其他用户数据')
    }
  }
}
