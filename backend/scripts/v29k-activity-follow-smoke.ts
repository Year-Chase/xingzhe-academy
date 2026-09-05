import { randomUUID } from 'crypto'
import { unlinkSync } from 'fs'
import { NestFactory } from '@nestjs/core'
import { DataSource } from 'typeorm'
import { Activity } from '../src/activity/entities/activity.entity'
import { ActivityFollow } from '../src/activity/entities/activity-follow.entity'
import { User } from '../src/users/entities/user.entity'
import { ActivityFollowService } from '../src/activity/activity-follow.service'
import { ActivityFlowService } from '../src/activity/activity-flow.service'
import { ActivityService } from '../src/activity/activity.service'
import { AdminActivitySeriesController } from '../src/activity/admin-activity-series.controller'

const dbPath = `/private/tmp/xingzhe-v29k-${process.pid}-${randomUUID()}.db`
process.env.SQLITE_DB_PATH = dbPath
process.env.MINIAPP_JWT_SECRET = 'v29k-local-miniapp-secret-0000000000'
process.env.ADMIN_TOKEN_SECRET = 'v29k-local-admin-secret-000000000000'
const assert = (value: unknown, message: string) => { if (!value) throw new Error(message) }
const cleanup = () => [dbPath, `${dbPath}-wal`, `${dbPath}-shm`].forEach(path => { try { unlinkSync(path) } catch {} })

async function main() {
  cleanup()
  const { AppModule } = await import('../src/app.module')
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false })
  const db = app.get(DataSource)
  const activities = db.getRepository(Activity); const users = db.getRepository(User); const follows = db.getRepository(ActivityFollow)
  const now = Date.now()
  const activity = await activities.save(activities.create({ title: 'follow smoke', location: '北京', status: 'PUBLISHED', capacity: 10, paymentMode: 'FULL', price: 1, startTime: new Date(now + 86400000), endTime: new Date(now + 90000000), registrationStartTime: new Date(now - 3600000), registrationEndTime: new Date(now + 3600000) } as any) as unknown as Activity)
  const makeUser = async (suffix: string): Promise<User> => users.save(users.create({ id: `follow_${suffix}`, openid: `openid_${suffix}`, nickname: suffix, registeredAt: new Date(), status: 'ACTIVE' } as any) as unknown as User)
  const userA = await makeUser('a'); const userB = await makeUser('b')
  const service = app.get(ActivityFollowService)
  await service.follow(userA.id, activity.id); await service.follow(userA.id, activity.id)
  assert(await follows.count({ where: { userId: userA.id, activityId: activity.id } }) === 1, 'duplicate follow record')
  await service.unfollow(userA.id, activity.id); await service.unfollow(userA.id, activity.id)
  assert(!(await service.isFollowed(userA.id, activity.id)), 'unfollow was not idempotent')
  await service.follow(userA.id, activity.id); await service.follow(userB.id, activity.id)
  assert(await follows.count({ where: { activityId: activity.id } }) === 2, 'users affected each other')
  const flow = app.get(ActivityFlowService)
  await flow.enrollPay(userA.id, activity.id)
  const converted = await follows.findOneByOrFail({ userId: userA.id, activityId: activity.id })
  assert(!!converted.convertedAt, 'follow conversion was not recorded')
  await flow.enrollPay(userA.id, activity.id)
  assert((await follows.findOneByOrFail({ userId: userA.id, activityId: activity.id })).convertedAt?.getTime() === converted.convertedAt?.getTime(), 'conversion was not idempotent')
  const stats = await service.getStats(activity.id)
  assert(stats.currentFollowers === 2 && stats.totalFollowers === 2 && stats.convertedFollowers === 1 && stats.conversionRate === 0.5, 'follow stats are incorrect')
  assert((await service.getFollowedActivities(userA.id, 1, 20)).items.length === 1, 'my follows query is incorrect')
  const adminSeries = app.get(AdminActivitySeriesController)
  const series = await adminSeries.create({ name: '官网品牌', externalUrl: ' https://example.com/brand ' })
  assert(series.externalUrl === 'https://example.com/brand', 'https externalUrl was not normalized')
  await adminSeries.create({ name: 'bad官网品牌', externalUrl: 'http://example.com' }).then(() => { throw new Error('http externalUrl was accepted') }, () => undefined)
  assert((await db.query("SELECT version FROM schema_migrations WHERE version = 'v2.9k-activity-follow' ")).length === 1, 'migration ledger missing')
  console.log('V2.9K follow and brand-link smoke PASS')
  await app.close(); cleanup()
}
main().catch(error => { console.error(error?.message || error); cleanup(); process.exit(1) })
