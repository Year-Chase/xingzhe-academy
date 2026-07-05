/**
 * 行者学社小程序 — 统一 API 配置
 *
 * 默认线上：https://api.tenselog.cn
 * 本地开发时设置环境变量：TARO_APP_API_BASE_URL=http://127.0.0.1:3000
 */

declare const __API_BASE_URL__: string | undefined

let API_BASE_URL = 'https://api.tenselog.cn'

// Taro defineConstants injects __API_BASE_URL__ at compile time
if (typeof __API_BASE_URL__ !== 'undefined' && __API_BASE_URL__) {
  API_BASE_URL = __API_BASE_URL__
}

export { API_BASE_URL }

export function resolveApiUrl(path: string): string {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
