/**
 * 行者学社 Admin — 统一 API 配置
 *
 * 本地开发：http://127.0.0.1:3000（通过环境变量 VITE_API_BASE_URL 或 import.meta.env.DEV）
 * V2.7 体验版 / 线上：https://api.tenselog.cn（通过环境变量 VITE_API_BASE_URL 或 生产构建时默认）
 *
 * 静态资源（uploads 图片等）跟随 API_BASE_URL。
 */

const envApiBase = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined
const isDev = (import.meta as any).env?.DEV as boolean | undefined

export const API_BASE_URL: string =
  envApiBase || (isDev ? 'http://127.0.0.1:3000' : 'https://api.tenselog.cn')

export function assetUrl(path: string): string {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return `${API_BASE_URL}${path.startsWith('/') ? path : '/' + path}`
}
