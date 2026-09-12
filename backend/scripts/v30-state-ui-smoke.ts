import * as assert from 'node:assert/strict'
import { resolveActivityTemporalState, resolveUserActivityState } from '../src/activity/user-activity-state'

const cases: Array<[string, any, string]> = [
  ['none', {}, 'NONE'],
  ['registered', { registrationStatus: 'REGISTERED', orderStatus: 'PENDING' }, 'REGISTERED'],
  ['pending checkin', { registrationStatus: 'PAID', orderStatus: 'PAID' }, 'PENDING_CHECKIN'],
  ['partial refund keeps participation', { registrationStatus: 'PAID', orderStatus: 'PARTIAL_REFUND' }, 'PENDING_CHECKIN'],
  ['checked in wins', { registrationStatus: 'CHECKED_IN', orderStatus: 'PAID' }, 'CHECKED_IN'],
  ['fully refunded loses participation', { registrationStatus: 'PAID', orderStatus: 'REFUNDED' }, 'REFUNDED'],
  ['cancelled', { registrationStatus: 'CANCELLED' }, 'CANCELLED'],
]
for (const [name, input, expected] of cases) assert.equal(resolveUserActivityState(input), expected, name)
console.log(`v30 state UI smoke passed (${cases.length} cases)`)

const now = Date.parse('2026-09-06T12:00:00.000Z')
assert.equal(resolveActivityTemporalState('2026-09-07T12:00:00.000Z', '2026-09-08T12:00:00.000Z', now), 'UPCOMING')
assert.equal(resolveActivityTemporalState('2026-09-06T11:00:00.000Z', '2026-09-06T13:00:00.000Z', now), 'ONGOING')
assert.equal(resolveActivityTemporalState('2026-09-05T11:00:00.000Z', '2026-09-05T13:00:00.000Z', now), 'ENDED')
console.log('v30 temporal state smoke passed (3 cases)')
