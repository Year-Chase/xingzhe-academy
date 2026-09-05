export interface ChinaCityPoint {
  x: number
  y: number
}

// Coordinates are normalized against the supplied China map SVG (696 x 379).
// Keep this table explicit rather than applying an unverified map projection.
export const CHINA_CITY_POINTS: Record<string, ChinaCityPoint> = {
  '北京': { x: 0.67, y: 0.29 },
  '北京市': { x: 0.67, y: 0.29 },
  '上海': { x: 0.78, y: 0.55 },
  '上海市': { x: 0.78, y: 0.55 },
  '广州': { x: 0.66, y: 0.76 },
  '广州市': { x: 0.66, y: 0.76 },
  '深圳': { x: 0.69, y: 0.78 },
  '深圳市': { x: 0.69, y: 0.78 },
  '香港': { x: 0.70, y: 0.80 },
  '香港特别行政区': { x: 0.70, y: 0.80 },
  '重庆': { x: 0.55, y: 0.62 },
  '重庆市': { x: 0.55, y: 0.62 },
  '成都': { x: 0.47, y: 0.60 },
  '成都市': { x: 0.47, y: 0.60 },
  '曲靖': { x: 0.45, y: 0.73 },
  '曲靖市': { x: 0.45, y: 0.73 },
  '昆明': { x: 0.42, y: 0.76 },
  '昆明市': { x: 0.42, y: 0.76 },
  '长沙': { x: 0.62, y: 0.67 },
  '长沙市': { x: 0.62, y: 0.67 },
  '南京': { x: 0.72, y: 0.51 },
  '南京市': { x: 0.72, y: 0.51 },
  '满洲里': { x: 0.48, y: 0.12 },
  '呼和浩特': { x: 0.55, y: 0.34 },
  '西安': { x: 0.57, y: 0.52 },
  '杭州': { x: 0.75, y: 0.58 },
  '武汉': { x: 0.65, y: 0.60 },
  '郑州': { x: 0.64, y: 0.51 },
  '天津': { x: 0.69, y: 0.33 },
  '青岛': { x: 0.73, y: 0.42 },
  '厦门': { x: 0.72, y: 0.72 },
  '三亚': { x: 0.60, y: 0.91 },
  '拉萨': { x: 0.24, y: 0.58 },
  '乌鲁木齐': { x: 0.14, y: 0.27 },
}

export function cityPoint(city: string): ChinaCityPoint | undefined {
  return CHINA_CITY_POINTS[city.trim()]
}
