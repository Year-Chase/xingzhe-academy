import * as assert from 'node:assert/strict'
import { randomUUID } from 'crypto'
import { unlinkSync } from 'fs'
import { NestFactory } from '@nestjs/core'
import { DataSource } from 'typeorm'
import { Activity } from '../src/activity/entities/activity.entity'
import { ActivityFollow } from '../src/activity/entities/activity-follow.entity'
import { ActivityRegistration } from '../src/activity/entities/activity-registration.entity'
import { ActivitySeries } from '../src/activity/entities/activity-series.entity'
import { User } from '../src/users/entities/user.entity'
import { ActivityFollowService } from '../src/activity/activity-follow.service'
import { ActivityService } from '../src/activity/activity.service'
import { UsersService } from '../src/users/users.service'

const dbPath = `/private/tmp/xingzhe-v30-activity-list-${process.pid}-${randomUUID()}.db`
process.env.SQLITE_DB_PATH = dbPath
process.env.MINIAPP_JWT_SECRET = 'v30-activity-list-local-miniapp-secret-0000'
process.env.ADMIN_TOKEN_SECRET = 'v30-activity-list-local-admin-secret-00000'
const cleanup = () => [dbPath, `${dbPath}-wal`, `${dbPath}-shm`].forEach((path) => { try { unlinkSync(path) } catch {} })

async function main() {
  cleanup()
  const { AppModule } = await import('../src/app.module')
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false })
  const db = app.get(DataSource)
  const activities = db.getRepository(Activity)
  const series = db.getRepository(ActivitySeries)
  const registrations = db.getRepository(ActivityRegistration)
  const follows = db.getRepository(ActivityFollow)
  const users = db.getRepository(User)
  const now = Date.now()
  const activeA = await series.save(series.create({ name: '品牌 A', code: 'smoke-a', status: 'ACTIVE', showActivities: true } as unknown as ActivitySeries))
  const activeB = await series.save(series.create({ name: '品牌 B', code: 'smoke-b', status: 'ACTIVE', showActivities: true } as unknown as ActivitySeries))
  const hidden = await series.save(series.create({ name: '隐藏品牌', code: 'smoke-hidden', status: 'ACTIVE', showActivities: false } as unknown as ActivitySeries))
  const createActivity = (title: string, seriesId: number | null): Activity => activities.create({
    title, seriesId, location: '北京', status: 'PUBLISHED', capacity: 10, paymentMode: 'FULL', price: 0,
    startTime: new Date(now + 86400000), endTime: new Date(now + 90000000),
    registrationStartTime: new Date(now - 3600000), registrationEndTime: new Date(now + 3600000),
  } as unknown as Activity)
  const [activityA, activityB, hiddenActivity] = await activities.save([
    createActivity('品牌 A 活动', activeA.id), createActivity('品牌 B 活动', activeB.id), createActivity('隐藏品牌活动', hidden.id),
  ])
  const activityService = app.get(ActivityService)
  assert.deepEqual((await activityService.getAll(1, 20, { seriesIds: [String(activeA.id)] })).items.map((item) => item.id), [activityA.id], 'single brand activity filter is incorrect')
  assert(!(await activityService.getAll(1, 20)).items.some((item) => item.id === hiddenActivity.id), 'hidden series activity leaked into all activities')

  const user = await users.save(users.create({ id: 'usr_v30_activity_list', wechatAppId: 'mock-app', openid: 'openid_v30_activity_list', registeredAt: new Date(), status: 'ACTIVE' } as unknown as User))
  await follows.save(follows.create({ userId: user.id, activityId: activityA.id, followedAt: new Date() } as unknown as ActivityFollow))
  await follows.save(follows.create({ userId: user.id, activityId: hiddenActivity.id, followedAt: new Date() } as unknown as ActivityFollow))
  const followService = app.get(ActivityFollowService)
  assert.deepEqual((await followService.getFollowedActivities(user.id, 1, 20, [String(activeA.id)])).items.map((item) => item.id), [activityA.id], 'single brand follow filter is incorrect')
  assert((await followService.getFollowedActivities(user.id, 1, 20)).items.some((item) => item.id === hiddenActivity.id), 'hidden series followed activity is missing from all follows')

  const registrationActivities = await activities.save([
    createActivity('报名 A', null), createActivity('报名 B', null), createActivity('报名 C', null),
  ])
  await registrations.save([
    registrations.create({ userId: user.id, activityId: registrationActivities[0].id, status: 'REGISTERED', createdAt: new Date(now - 3000) } as unknown as ActivityRegistration),
    registrations.create({ userId: user.id, activityId: registrationActivities[1].id, status: 'REGISTERED', createdAt: new Date(now - 2000) } as unknown as ActivityRegistration),
    registrations.create({ userId: user.id, activityId: registrationActivities[2].id, status: 'REGISTERED', createdAt: new Date(now - 1000) } as unknown as ActivityRegistration),
  ])
  const registrationItems = await app.get(UsersService).getMyRegistrations(user.id)
  assert.deepEqual(registrationItems.items.slice(0, 3).map((item) => item.activityTitle), ['报名 C', '报名 B', '报名 A'], 'registrations are not ordered by registration createdAt DESC')

  console.log('V3.0 activity list smoke PASS')
  await app.close()
  cleanup()
}

main().then(() => process.exit(0)).catch((error) => { console.error(error?.message || error); cleanup(); process.exit(1) })
