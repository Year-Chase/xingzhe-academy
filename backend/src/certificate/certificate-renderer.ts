export const CERTIFICATE_CANVAS = { width: 1754, height: 1240 } as const

export const CERTIFICATE_FONT_REGISTRY = {
  'system-modern': { label: '现代黑体', svgFamily: 'PingFang SC, Microsoft YaHei, sans-serif' },
  'system-medium': { label: '现代粗黑', svgFamily: 'PingFang SC, Microsoft YaHei, sans-serif' },
  'system-serif': { label: '系统宋体', svgFamily: 'Songti SC, SimSun, serif' },
} as const

export type CertificateFontKey = keyof typeof CERTIFICATE_FONT_REGISTRY
export type CertificateFieldKey = 'recipientName' | 'activityName' | 'city' | 'activityDate' | 'activitySlogan'
export type CertificateTextAlign = 'left' | 'center' | 'right'

export type CertificateFieldSnapshot = {
  visible: boolean
  value: string
  x: number
  y: number
  width: number
  maxLines: 1 | 2
  minFontSize: number
  fontKey: CertificateFontKey
  fontSize: number
  fontWeight: 400 | 500 | 600 | 700
  color: string
  align: CertificateTextAlign
}

export type CertificateRenderSnapshot = {
  version: 1
  templateId: number | null
  templateUpdatedAt: string | null
  backgroundImageUrl: string
  canvas: typeof CERTIFICATE_CANVAS
  activityEndAt: string | null
  issuedAt: string
  fields: Record<CertificateFieldKey, CertificateFieldSnapshot>
}

export const DEFAULT_CERTIFICATE_FIELDS: Record<CertificateFieldKey, Omit<CertificateFieldSnapshot, 'visible' | 'value'>> = {
  recipientName: { x: .12, y: .26, width: .42, maxLines: 1, minFontSize: 48, fontKey: 'system-medium', fontSize: 92, fontWeight: 700, color: '#17372F', align: 'left' },
  activityName: { x: .24, y: .47, width: .38, maxLines: 2, minFontSize: 30, fontKey: 'system-medium', fontSize: 48, fontWeight: 600, color: '#17372F', align: 'left' },
  city: { x: .24, y: .57, width: .16, maxLines: 1, minFontSize: 22, fontKey: 'system-modern', fontSize: 32, fontWeight: 500, color: '#304E42', align: 'left' },
  activityDate: { x: .46, y: .57, width: .20, maxLines: 1, minFontSize: 22, fontKey: 'system-modern', fontSize: 32, fontWeight: 500, color: '#304E42', align: 'left' },
  activitySlogan: { x: .70, y: .10, width: .23, maxLines: 2, minFontSize: 26, fontKey: 'system-serif', fontSize: 40, fontWeight: 500, color: '#304E42', align: 'left' },
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const normalized = (value: unknown, fallback: number) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return number > 1 ? number / 100 : number
}
const fontKey = (value: unknown): CertificateFontKey => {
  if (value === 'system-modern' || value === 'system-medium' || value === 'system-serif') return value
  if (value === 'serif') return 'system-serif'
  return value === 'sans' ? 'system-modern' : 'system-modern'
}
const weight = (value: unknown, fallback: 400 | 500 | 600 | 700): 400 | 500 | 600 | 700 => {
  const number = Number(value)
  if (number >= 700) return 700
  if (number >= 600) return 600
  if (number >= 500) return 500
  return number >= 400 ? 400 : fallback
}

function rawField(config: any, key: CertificateFieldKey) {
  const fields = config?.fields || config || {}
  if (key === 'city') return fields.city ?? fields.location
  if (key === 'activityDate') return fields.activityDate ?? fields.issuedAt
  return fields[key]
}

export function createCertificateRenderSnapshot(input: {
  templateId: number | null
  templateUpdatedAt?: Date | string | null
  backgroundImageUrl: string
  renderConfig: Record<string, any>
  recipientName: string
  activityName: string
  activityLocation: string
  activityEndAt: Date | string | null
  activitySlogan: string
  issuedAt: Date | string
}): CertificateRenderSnapshot {
  const date = input.activityEndAt ? new Date(input.activityEndAt) : null
  const values: Record<CertificateFieldKey, string> = {
    recipientName: input.recipientName || '行者',
    activityName: input.activityName || '',
    city: input.activityLocation || '',
    activityDate: date && !Number.isNaN(date.getTime()) ? `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}` : '',
    activitySlogan: input.activitySlogan || '',
  }
  const fields = {} as Record<CertificateFieldKey, CertificateFieldSnapshot>
  for (const key of Object.keys(DEFAULT_CERTIFICATE_FIELDS) as CertificateFieldKey[]) {
    const fallback = DEFAULT_CERTIFICATE_FIELDS[key]
    const raw = rawField(input.renderConfig, key)
    const visible = raw === undefined ? true : typeof raw === 'object' ? raw.visible !== false && raw.enabled !== false : raw !== false
    const x = clamp(normalized(raw?.x, fallback.x), .08, .92 - fallback.width)
    const width = clamp(normalized(raw?.width, fallback.width), .10, .84)
    fields[key] = {
      ...fallback,
      visible,
      value: values[key],
      x: clamp(x, .08, .92 - width),
      y: clamp(normalized(raw?.y, fallback.y), .08, .88),
      width,
      fontKey: fontKey(raw?.fontKey ?? raw?.fontFamily ?? fallback.fontKey),
      fontSize: clamp(Number(raw?.fontSize || fallback.fontSize), fallback.minFontSize, key === 'recipientName' ? 120 : key === 'activityName' ? 72 : key === 'activitySlogan' ? 64 : 48),
      fontWeight: weight(raw?.fontWeight, fallback.fontWeight),
      color: /^#[0-9A-Fa-f]{6}$/.test(String(raw?.color || '')) ? String(raw.color).toUpperCase() : fallback.color,
      align: raw?.align === 'center' || raw?.align === 'right' ? raw.align : 'left',
    }
  }
  return {
    version: 1,
    templateId: input.templateId,
    templateUpdatedAt: input.templateUpdatedAt ? new Date(input.templateUpdatedAt).toISOString() : null,
    backgroundImageUrl: input.backgroundImageUrl || '',
    canvas: CERTIFICATE_CANVAS,
    activityEndAt: date && !Number.isNaN(date.getTime()) ? date.toISOString() : null,
    issuedAt: new Date(input.issuedAt).toISOString(),
    fields,
  }
}

const escapeXml = (value: string) => value.replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[char] || char))
const textUnits = (value: string) => [...value].reduce((sum, char) => sum + (/^[\x00-\x7F]$/.test(char) ? .56 : 1), 0)

function fitFontSize(field: CertificateFieldSnapshot) {
  const available = field.width * CERTIFICATE_CANVAS.width
  const total = Math.max(1, textUnits(field.value))
  const fitted = available * field.maxLines / total
  return Math.max(field.minFontSize, Math.min(field.fontSize, fitted))
}

function splitLines(value: string, maxUnits: number, maxLines: number) {
  const lines: string[] = []
  let current = ''
  let units = 0
  let truncated = false
  for (const char of value) {
    const unit = /^[\x00-\x7F]$/.test(char) ? .56 : 1
    if (current && units + unit > maxUnits) {
      if (lines.length >= maxLines - 1) {
        truncated = true
        break
      }
      lines.push(current)
      current = ''
      units = 0
    }
    current += char; units += unit
  }
  if (current) lines.push(current)
  if (truncated && lines.length) lines[lines.length - 1] = `${lines[lines.length - 1].slice(0, -1)}…`
  return lines
}

function renderField(field: CertificateFieldSnapshot) {
  if (!field.visible || !field.value) return ''
  const size = fitFontSize(field)
  const boxX = field.x * CERTIFICATE_CANVAS.width
  const boxWidth = field.width * CERTIFICATE_CANVAS.width
  const x = field.align === 'center' ? boxX + boxWidth / 2 : field.align === 'right' ? boxX + boxWidth : boxX
  const anchor = field.align === 'center' ? 'middle' : field.align === 'right' ? 'end' : 'start'
  const maxUnits = boxWidth / Math.max(size, 1)
  const lines = splitLines(field.value, maxUnits, field.maxLines)
  const startY = field.y * CERTIFICATE_CANVAS.height + size
  const family = CERTIFICATE_FONT_REGISTRY[field.fontKey].svgFamily
  const tspans = lines.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : size * 1.15}">${escapeXml(line)}</tspan>`).join('')
  return `<text x="${x}" y="${startY}" text-anchor="${anchor}" font-size="${size}" font-weight="${field.fontWeight}" font-family="${escapeXml(family)}" fill="${field.color}">${tspans}</text>`
}

export function renderCertificateSvg(snapshot: CertificateRenderSnapshot) {
  const background = snapshot.backgroundImageUrl
    ? `<image href="${escapeXml(snapshot.backgroundImageUrl)}" x="0" y="0" width="1754" height="1240" preserveAspectRatio="xMidYMid meet"/>`
    : '<rect width="1754" height="1240" fill="#F4F1EA"/>'
  const fields = (Object.keys(snapshot.fields) as CertificateFieldKey[]).map(key => renderField(snapshot.fields[key])).join('')
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="1754" height="1240" viewBox="0 0 1754 1240">${background}${fields}</svg>`
}
