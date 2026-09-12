import { SystemTagRefreshJob } from '../src/activity/jobs/system-tag-refresh.job'

class FakeRepo {
  rows: any[] = []
  nextId = 1

  constructor(rows: any[] = []) { this.rows = rows }
  find(options: any = {}) {
    const where = options?.where || {}
    return Promise.resolve(this.rows.filter(row => Object.entries(where).every(([key, value]) => row[key] === value)))
  }
  findOne(options: any) {
    const where = options?.where || {}
    return Promise.resolve(this.rows.find(row => Object.entries(where).every(([key, value]) => row[key] === value)) || null)
  }
  create(value: any) { return { ...value } }
  save(row: any) {
    if (!row.id) row.id = String(this.nextId++)
    const existing = this.rows.findIndex(item => item.id === row.id)
    if (existing >= 0) this.rows[existing] = row
    else this.rows.push(row)
    return Promise.resolve(row)
  }
  remove(rows: any[]) {
    const ids = new Set(rows.map(row => row.id))
    this.rows = this.rows.filter(row => !ids.has(row.id))
    return Promise.resolve()
  }
}

const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message) }
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)

async function main() {
  const users = new FakeRepo([
    { id: 'new-user', registeredAt: new Date() },
    { id: 'old-user', registeredAt: daysAgo(400) },
    { id: 'active-user', registeredAt: daysAgo(400) },
  ])
  const registrations = new FakeRepo([
    { id: 'old-reg', userId: 'old-user', createdAt: daysAgo(240), status: 'REGISTERED' },
    { id: 'recent-reg', userId: 'active-user', createdAt: daysAgo(10), status: 'CHECKED_IN' },
  ])
  const orders = new FakeRepo()
  const invites = new FakeRepo()
  const activityInvites = new FakeRepo()
  const definitions = new FakeRepo()
  const relations = new FakeRepo()
  const job = new SystemTagRefreshJob(users as any, registrations as any, orders as any, invites as any, activityInvites as any, definitions as any, relations as any)

  await job.refresh()
  const dormant = definitions.rows.find(row => row.ruleCode === 'DORMANT_USER')
  const newUser = definitions.rows.find(row => row.ruleCode === 'NEW_USER')
  const dormantUsers = new Set(relations.rows.filter(row => row.tagId === dormant.id).map(row => row.userId))
  const newUsers = new Set(relations.rows.filter(row => row.tagId === newUser.id).map(row => row.userId))
  assert(dormantUsers.has('old-user'), 'historical inactive user should be dormant')
  assert(!dormantUsers.has('new-user'), 'new user without history must not be dormant')
  assert(!dormantUsers.has('active-user'), 'recently active user must not be dormant')
  assert(newUsers.has('new-user'), 'new user should retain NEW_USER')

  registrations.rows = []
  await job.refresh()
  assert(!relations.rows.some(row => row.tagId === dormant.id), 'dormant relation should be removed when history disappears')
  console.log('V3.0 Fix-3 system tag smoke PASS')
}

main().catch(error => { console.error(error?.message || error); process.exit(1) })
