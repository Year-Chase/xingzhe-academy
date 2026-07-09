import { BadRequestException, Injectable } from '@nestjs/common'

type SafetyScene = 'profile' | 'comment' | 'activity'

interface TokenCache {
  token: string
  expiresAt: number
}

@Injectable()
export class ContentSecurityService {
  private tokenCache: TokenCache | null = null

  async checkTextSafety(params: {
    openid?: string | null
    scene: SafetyScene
    content: string
  }): Promise<{ pass: boolean; reason?: string }> {
    const content = (params.content || '').trim()
    if (!content) return { pass: true }

    const appId = process.env.WECHAT_APPID || process.env.MINIAPP_APPID
    const secret = process.env.WECHAT_SECRET || process.env.MINIAPP_SECRET
    const shouldRequireWechat = process.env.NODE_ENV === 'production' || process.env.WECHAT_LOGIN_MODE === 'real'

    if (!appId || !secret) {
      if (shouldRequireWechat) {
        throw new BadRequestException('内容安全校验暂不可用，请稍后再试')
      }
      return { pass: true }
    }

    try {
      const accessToken = await this.getAccessToken(appId, secret)
      const resp = await fetch(`https://api.weixin.qq.com/wxa/msg_sec_check?access_token=${accessToken}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          content,
          version: 2,
          scene: this.sceneCode(params.scene),
          openid: params.openid || undefined,
        }),
      })
      const data = await resp.json() as any

      if (data.errcode !== 0) {
        return { pass: false, reason: '内容安全校验未通过' }
      }

      const suggest = data?.result?.suggest
      if (suggest && suggest !== 'pass') {
        return { pass: false, reason: '内容安全校验未通过' }
      }
      return { pass: true }
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      throw new BadRequestException('内容安全校验暂不可用，请稍后再试')
    }
  }

  private sceneCode(scene: SafetyScene): number {
    if (scene === 'comment') return 2
    if (scene === 'activity') return 3
    return 1
  }

  private async getAccessToken(appId: string, secret: string): Promise<string> {
    const now = Date.now()
    if (this.tokenCache && this.tokenCache.expiresAt > now + 60_000) {
      return this.tokenCache.token
    }

    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${secret}`
    const resp = await fetch(url)
    const data = await resp.json() as any
    if (!data.access_token) {
      throw new BadRequestException('内容安全校验暂不可用，请稍后再试')
    }

    this.tokenCache = {
      token: data.access_token,
      expiresAt: now + Math.max(300, Number(data.expires_in || 7200) - 300) * 1000,
    }
    return data.access_token
  }
}
