const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export function formatActivityStart(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${date.getMonth() + 1}月${date.getDate()}日 周${WEEKDAYS[date.getDay()]} ${hours}:${minutes}`
}

export function userActivityStateLabel(state?: string | null): string {
  return ({
    REGISTERED: '已报名',
    PENDING_CHECKIN: '待签到',
    CHECKED_IN: '已签到',
    CANCELLED: '已取消',
    REFUNDED: '已退款',
  } as Record<string, string>)[state || ''] || ''
}

export function activityTemporalStateLabel(state?: string | null): string {
  return ({ UPCOMING: '即将开始', ONGOING: '进行中', ENDED: '已结束' } as Record<string, string>)[state || ''] || ''
}

export function hasUserActivityState(state?: string | null): boolean {
  return Boolean(userActivityStateLabel(state))
}
