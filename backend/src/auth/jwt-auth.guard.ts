import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { AdminTokenService } from './admin-token.service'

/**
 * V2.7.1 Admin Auth Guard.
 *
 * What it actually does:
 * 1. No Authorization header → 401 "未登录或 token 已过期"
 * 2. Not Bearer format → 401
 * 3. Empty token → 401
 * 4. Token signature (HMAC-SHA256) does not match → 401 "token 签名不正确"
 * 5. Token expired → 401 "token 已过期"
 * 6. Token valid → attaches { admin: payload } to request, returns true
 *
 * A Bearer token like "Bearer fake-token" or "Bearer abc123" WILL be rejected
 * because its signature won't verify against ADMIN_TOKEN_SECRET.
 *
 * Security boundary (V2.7.1):
 * - Token is NOT a JWT standard — it uses HMAC-SHA256 signing with base64url encoding.
 * - Token secret is stored in server-side .env (ADMIN_TOKEN_SECRET).
 * - There is no key rotation, refresh token, or role-based access control.
 * - This is a minimum viable implementation for a single admin user.
 * - V2.8+ should upgrade to standard JWT (RS256) with proper key management.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokenService: AdminTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()

    // 1. No Authorization header
    const authHeader = request.headers?.authorization || request.headers?.Authorization || ''
    if (!authHeader) {
      throw new UnauthorizedException('未登录或 token 已过期')
    }

    // 2. Not Bearer format
    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('未登录或 token 已过期')
    }

    // 3. Empty token
    const token = authHeader.slice(7)
    if (!token) {
      throw new UnauthorizedException('未登录或 token 已过期')
    }

    // 4-6. Signature verification + expiry check
    const payload = this.tokenService.verifyToken(token)

    // Attach to request for potential future use (e.g. audit log)
    request.admin = payload

    return true
  }
}
