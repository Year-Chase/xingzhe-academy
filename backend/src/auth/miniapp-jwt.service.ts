import { Injectable, UnauthorizedException } from '@nestjs/common'
import { createHmac, timingSafeEqual } from 'crypto'

export type MiniappJwtPayload = {
  sub: string
  typ: 'miniapp'
  ver: 1
  iat: number
  exp: number
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4)
  return Buffer.from(padded, 'base64').toString('utf8')
}

function parseExpiresIn(raw: string | undefined): number {
  const value = (raw || '30d').trim()
  const matched = value.match(/^(\d+)([smhd])?$/)
  if (!matched) throw new UnauthorizedException('小程序 token 过期配置无效')
  const amount = Number(matched[1])
  const unit = matched[2] || 's'
  const multiplier = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400
  return amount * multiplier
}

@Injectable()
export class MiniappJwtService {
  issueToken(userId: string): string {
    const iat = Math.floor(Date.now() / 1000)
    const exp = iat + parseExpiresIn(process.env.MINIAPP_JWT_EXPIRES_IN)
    return this.signPayload({ sub: userId, typ: 'miniapp', ver: 1, iat, exp })
  }

  verifyToken(token: string): MiniappJwtPayload {
    if (!token || token.startsWith('xztok_')) throw new UnauthorizedException('请重新登录')
    const parts = token.split('.')
    if (parts.length !== 3) throw new UnauthorizedException('小程序 token 格式无效')
    const [headerEncoded, payloadEncoded, signature] = parts
    const expected = this.sign(`${headerEncoded}.${payloadEncoded}`)
    const sigBuf = Buffer.from(signature, 'utf8')
    const expectedBuf = Buffer.from(expected, 'utf8')
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      throw new UnauthorizedException('小程序 token 签名无效')
    }
    let header: any
    let payload: any
    try {
      header = JSON.parse(base64UrlDecode(headerEncoded))
      payload = JSON.parse(base64UrlDecode(payloadEncoded))
    } catch {
      throw new UnauthorizedException('小程序 token 内容无效')
    }
    if (header?.alg !== 'HS256' || header?.typ !== 'JWT') throw new UnauthorizedException('小程序 token 算法无效')
    if (payload?.typ !== 'miniapp' || payload?.ver !== 1 || !payload?.sub) throw new UnauthorizedException('小程序 token 类型无效')
    if (!payload.exp || typeof payload.exp !== 'number') throw new UnauthorizedException('小程序 token 缺少过期时间')
    if (payload.exp < Math.floor(Date.now() / 1000)) throw new UnauthorizedException('小程序 token 已过期')
    return payload as MiniappJwtPayload
  }

  private signPayload(payload: MiniappJwtPayload): string {
    const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const body = base64UrlEncode(JSON.stringify(payload))
    const signature = this.sign(`${header}.${body}`)
    return `${header}.${body}.${signature}`
  }

  private sign(content: string): string {
    return createHmac('sha256', this.getSecret())
      .update(content)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
  }

  private getSecret(): string {
    const secret = process.env.MINIAPP_JWT_SECRET
    if (secret && secret.length >= 32) return secret
    const isProduction = process.env.NODE_ENV === 'production' || !!process.env.DB_HOST
    if (isProduction) throw new UnauthorizedException('服务端小程序 token 配置缺失')
    return 'dev-only-miniapp-jwt-secret-change-before-production'
  }
}
