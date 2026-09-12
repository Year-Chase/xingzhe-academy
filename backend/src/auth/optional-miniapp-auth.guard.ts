import { ExecutionContext, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { MiniappJwtService } from './miniapp-jwt.service'
import { User } from '../users/entities/user.entity'

@Injectable()
export class OptionalMiniappAuthGuard {
  constructor(private readonly jwt: MiniappJwtService, @InjectRepository(User) private readonly userRepo: Repository<User>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const header = request.headers?.authorization || request.headers?.Authorization || ''
    if (!header.startsWith('Bearer ')) return true
    try {
      const payload = await this.jwt.verifyToken(header.slice('Bearer '.length).trim())
      const user = await this.userRepo.findOne({ where: { id: payload.sub } })
      if (user?.status === 'ACTIVE') request.user = { userId: user.id, tokenType: 'miniapp' }
    } catch {
      // An expired optional token must not block public activity browsing.
    }
    return true
  }
}
