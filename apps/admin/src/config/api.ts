/**
 * 行者学社 Admin — 统一 API 配置
 *
 * API 请求通过 vite proxy（开发）或 Nginx（生产）走相对路径 /api/...
 * 静态资源（uploads 图片等）需要完整 URL 前缀
 *
 * 本地开发：http://127.0.0.1:3000
 * V2.7 体验版 / 线上：https://api.tenselog.cn
 */

export const API_BASE_URL = 'https://api.tenselog.cn'

export function assetUrl(path: string): string {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return `${API_BASE_URL}${path.startsWith('/') ? path : '/' + path}`
}
