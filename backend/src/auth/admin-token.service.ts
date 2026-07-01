import { Injectable, UnauthorizedException } from '@nestjs/common'
import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Admin token service using Node built-in crypto (HMAC-SHA256).
 * No external JWT dependency.
 *
 * Token format: base64Url(JSON payload).base64Url(HMAC-SHA256 signature)
 * Payload: { username, iat (seconds), exp (seconds) }
 *
 * Env vars (loaded from .env):
 *   ADMIN_TOKEN_SECRET  — random 64+ char string (REQUIRED)
 *   ADMIN_TOKEN_EXPIRES_SECONDS — default 86400 (24h)
 */

function base64UrlEncode(str: string): string {
  return Buffer.from(str, 'utf-8')
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64UrlDecode(str: string): string {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(b64, 'base64').toString('utf-8')
}

function getSecret(): string {
  const s = process.env.ADMIN_TOKEN_SECRET
  if (!s || s.length < 16) {
    throw new UnauthorizedException('服务端 token 配置缺失')
  }
  return s
}

function getExpiresSeconds(): number {
  return parseInt(process.env.ADMIN_TOKEN_EXPIRES_SECONDS || '86400', 10)
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

@Injectable()
export class AdminTokenService {
  /**
   * Issue a signed token for a successfully authenticated admin user.
   */
  issueToken(username: string): string {
    const iat = Math.floor(Date.now() / 1000)
    const exp = iat + getExpiresSeconds()
    const payloadStr = JSON.stringify({ username, iat, exp })
    const encoded = base64UrlEncode(payloadStr)
    const sig = sign(encoded)
    return `${encoded}.${sig}`
  }

  /**
   * Verify a token and return the decoded payload.
   * Throws UnauthorizedException on any failure.
   */
  verifyToken(token: string): { username: string; iat: number; exp: number } {
    const parts = token.split('.')
    if (parts.length !== 2) {
      throw new UnauthorizedException('token 格式无效')
    }

    const [payloadEncoded, signature] = parts
    const expectedSig = sign(payloadEncoded)

    // Timing-safe compare to prevent timing attacks
    const sigBuf = Buffer.from(signature, 'utf-8')
    const expectBuf = Buffer.from(expectedSig, 'utf-8')
    if (sigBuf.length !== expectBuf.length || !timingSafeEqual(sigBuf, expectBuf)) {
      throw new UnauthorizedException('token 签名不正确')
    }

    let payload: any
    try {
      payload = JSON.parse(base64UrlDecode(payloadEncoded))
    } catch {
      throw new UnauthorizedException('token 数据无效')
    }

    if (!payload.exp || typeof payload.exp !== 'number') {
      throw new UnauthorizedException('token 缺少过期时间')
    }

    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) {
      throw new UnauthorizedException('token 已过期')
    }

    return payload
  }
}
