export type UserActivityState = 'NONE' | 'REGISTERED' | 'PENDING_CHECKIN' | 'CHECKED_IN' | 'CANCELLED' | 'REFUNDED'
export type ActivityTemporalState = 'UPCOMING' | 'ONGOING' | 'ENDED'

export function resolveActivityTemporalState(start?: Date | string | null, end?: Date | string | null, now = Date.now()): ActivityTemporalState {
  const startAt = start ? new Date(start).getTime() : NaN
  const endAt = end ? new Date(end).getTime() : NaN
  if (Number.isFinite(endAt) && now > endAt) return 'ENDED'
  if (Number.isFinite(startAt) && now >= startAt) return 'ONGOING'
  return 'UPCOMING'
}

export function resolveUserActivityState(input?: { registrationStatus?: string | null; orderStatus?: string | null }): UserActivityState {
  const registration = String(input?.registrationStatus || '')
  const order = String(input?.orderStatus || '')
  if (!registration) return 'NONE'
  if (registration === 'CHECKED_IN') return 'CHECKED_IN'
  if (order === 'REFUNDED' || registration === 'REFUNDED') return 'REFUNDED'
  if (registration === 'CANCELLED' || order === 'CANCELLED') return 'CANCELLED'
  if (registration === 'REGISTERED' || order === 'PENDING') return 'REGISTERED'
  if (registration === 'PAID' || ['PAID', 'PARTIAL_REFUND'].includes(order)) return 'PENDING_CHECKIN'
  return 'NONE'
}
