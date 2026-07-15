import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

export type MiniappJwtPayload = {
  sub: string
  typ: 'miniapp'
  ver: 1
  iat?: number
  exp?: number
}

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production' || !!process.env.DB_HOST
}

function getMiniappSecret(): string {
  const secret = process.env.MINIAPP_JWT_SECRET
  if (secret && secret.length >= 32) return secret
  if (isProductionRuntime()) throw new Error('MINIAPP_JWT_SECRET is required in production')
  throw new Error('MINIAPP_JWT_SECRET is required')
}

function getMiniappExpiresIn(): string {
  return (process.env.MINIAPP_JWT_EXPIRES_IN || '30d').trim() || '30d'
}

@Injectable()
export class MiniappJwtService implements OnModuleInit {
  constructor(private readonly jwt: JwtService) {}

  onModuleInit() {
    getMiniappSecret()
  }

  async issueToken(userId: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, typ: 'miniapp', ver: 1 } satisfies MiniappJwtPayload,
      {
        secret: getMiniappSecret(),
        algorithm: 'HS256',
        expiresIn: getMiniappExpiresIn(),
      },
    )
  }

  async verifyToken(token: string): Promise<MiniappJwtPayload> {
    if (!token || token.startsWith('xztok_')) throw new UnauthorizedException('请重新登录')
    let payload: any
    try {
      payload = await this.jwt.verifyAsync(token, {
        secret: getMiniappSecret(),
        algorithms: ['HS256'],
      })
    } catch {
      throw new UnauthorizedException('小程序 token 无效')
    }
    if (!payload?.sub || typeof payload.sub !== 'string') throw new UnauthorizedException('小程序 token 缺少用户')
    if (payload.typ !== 'miniapp' || payload.ver !== 1) throw new UnauthorizedException('小程序 token 类型无效')
    return payload as MiniappJwtPayload
  }
}
