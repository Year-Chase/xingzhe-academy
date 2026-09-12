import { Image, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { API_BASE_URL as API } from '../../config/api'
import { activityTemporalStateLabel, formatActivityStart, hasUserActivityState, userActivityStateLabel } from '../../utils/activity-display'

export interface ActivityCardItem {
  id: number
  title: string
  description?: string
  location?: string
  startTime?: string
  endTime?: string
  coverImage?: string
  imageUrls?: any
  userActivityState?: string
  activityTemporalState?: string
}

const C = { white: '#FFFFFF', green: '#2E7D5A', dark: '#202923', body: '#4B564F', muted: '#747D77', weak: '#A3AAA5', lightGreen: '#EEF6F1', border: '#E6EAE6' }
const PLACEHOLDER_BG = 'linear-gradient(160deg, #DCE6E2 0%, #BED5C5 36%, #9AB8A8 100%)'

function resourceUrl(path?: string) { return !path ? '' : path.startsWith('http') ? path : `${API}${path.startsWith('/') ? '' : '/'}${path}` }
function coverFor(activity: ActivityCardItem) {
  try {
    const images = Array.isArray(activity.imageUrls) ? activity.imageUrls : JSON.parse(activity.imageUrls || 'null')
    if (Array.isArray(images) && images.length) return resourceUrl(images[0])
  } catch {}
  return resourceUrl(activity.coverImage)
}

function fallbackTemporalState(activity: ActivityCardItem) {
  const now = Date.now()
  const start = new Date(activity.startTime || '').getTime()
  const end = new Date(activity.endTime || '').getTime()
  if (Number.isFinite(end) && now > end) return '已结束'
  if (Number.isFinite(start) && now >= start) return '进行中'
  return '即将开始'
}

export function ActivityCard({ activity, faded = false, edgeMargin = '24rpx' }: { activity: ActivityCardItem; faded?: boolean; edgeMargin?: string }) {
  const temporal = activityTemporalStateLabel(activity.activityTemporalState) || fallbackTemporalState(activity)
  const ended = temporal === '已结束'
  const cover = coverFor(activity)
  const hasUserState = hasUserActivityState(activity.userActivityState)
  return <View onClick={() => Taro.navigateTo({ url: `/pages/activity/detail/index?id=${activity.id}` })} hoverStyle={{ opacity: 0.72 }} style={{ margin: `0 ${edgeMargin} 20rpx`, background: C.white, borderRadius: '22rpx', padding: '16rpx', border: `1rpx solid ${C.border}`, display: 'flex', flexDirection: 'row', boxSizing: 'border-box', opacity: faded || ended ? 0.62 : 1, position: 'relative' }}>
    <View style={{ width: '176rpx', height: '132rpx', borderRadius: '16rpx', background: PLACEHOLDER_BG, flexShrink: 0, overflow: 'hidden' }}>{cover ? <Image src={cover} mode='aspectFill' style={{ width: '100%', height: '100%' }} /> : null}</View>
    <View style={{ flex: 1, minWidth: 0, paddingLeft: '18rpx', paddingRight: hasUserState ? '104rpx' : '0', display: 'flex', flexDirection: 'column' }}>
      <Text style={{ fontSize: '20rpx', color: ended ? C.weak : C.green, fontWeight: '400', lineHeight: '1.3' }}>{temporal}</Text>
      <Text style={{ fontSize: '28rpx', fontWeight: '600', color: C.dark, lineHeight: '1.32', display: 'block', marginTop: '6rpx', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.title}</Text>
      {activity.description ? <Text style={{ fontSize: '22rpx', color: C.body, lineHeight: '1.45', display: '-webkit-box', marginTop: '8rpx', overflow: 'hidden', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{activity.description}</Text> : null}
      {activity.startTime ? <Text style={{ fontSize: '22rpx', color: C.muted, display: 'block', marginTop: activity.description ? '10rpx' : '12rpx', lineHeight: '1.4' }}>{formatActivityStart(activity.startTime)}</Text> : null}
      {activity.location ? <Text style={{ fontSize: '22rpx', color: C.muted, display: 'block', marginTop: '5rpx', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.location}</Text> : null}
    </View>
    {hasUserState ? <View style={{ position: 'absolute', right: '16rpx', top: '16rpx', padding: '5rpx 12rpx', borderRadius: '999rpx', background: activity.userActivityState === 'CHECKED_IN' || activity.userActivityState === 'PENDING_CHECKIN' ? C.lightGreen : '#F1F1EE' }}><Text style={{ fontSize: '20rpx', color: activity.userActivityState === 'CHECKED_IN' || activity.userActivityState === 'PENDING_CHECKIN' ? C.green : C.muted, fontWeight: '600' }}>{userActivityStateLabel(activity.userActivityState)}</Text></View> : null}
  </View>
}
