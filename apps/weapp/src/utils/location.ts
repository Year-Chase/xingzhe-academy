import Taro from '@tarojs/taro'

/**
 * Check if an activity has location data suitable for opening in WeChat Maps.
 */
export function canOpenActivityLocation(activity: any): boolean {
  const lat = Number(activity?.locationLat)
  const lng = Number(activity?.locationLng)
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

/**
 * Open WeChat Maps for an activity location.
 * Returns false if coordinates are missing.
 */
export function openActivityLocation(activity: any): boolean {
  if (!canOpenActivityLocation(activity)) {
    Taro.showToast({ title: '暂无可导航定位', icon: 'none' })
    return false
  }
  const lat = Number(activity.locationLat)
  const lng = Number(activity.locationLng)
  const locName = activity.locationName || activity.title || '活动地点'
  const locAddr = activity.locationAddress || activity.location || ''
  Taro.openLocation({
    latitude: lat,
    longitude: lng,
    name: locName,
    address: locAddr,
    scale: 16,
    success: () => {
      console.log('[location] openLocation success', { latitude: lat, longitude: lng, name: locName, address: locAddr })
    },
    fail: (error) => {
      console.error('[location] openLocation fail', { latitude: lat, longitude: lng, name: locName, address: locAddr, error })
      Taro.showToast({ title: '导航打开失败，请稍后重试', icon: 'none' })
    },
    complete: (res) => {
      console.log('[location] openLocation complete', res)
    },
  })
  return true
}

/**
 * Format location text for display.
 * Falls back to legacy province/city/location if new fields are empty.
 */
export function formatActivityLocationText(activity: any): { name: string; address: string } {
  const name = activity?.locationName || activity?.location || ''
  const address = activity?.locationAddress || activity?.location || ''
  return { name, address }
}
