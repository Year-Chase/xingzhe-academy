/**
 * 行者学社小程序 — 统一 API 配置
 *
 * 本地开发真机调试：'http://你的Mac局域网IP:3000'
 * V2.7 体验版 / 线上：'https://api.tenselog.cn'
 */

export const API_BASE_URL = 'https://api.tenselog.cn'

export function resolveApiUrl(path: string): string {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
