import { randomUUID } from 'crypto'
import { unlinkSync } from 'fs'
import { NestFactory } from '@nestjs/core'
import { DataSource, Repository } from 'typeorm'
import { Activity } from '../src/activity/entities/activity.entity'
import { ActivityRegistration } from '../src/activity/entities/activity-registration.entity'
import { User } from '../src/users/entities/user.entity'
import { UsersService } from '../src/users/users.service'
import { UsersController } from '../src/users/users.controller'

const dbPath = `/private/tmp/xingzhe-ui-polish-${process.pid}-${randomUUID()}.db`
process.env.SQLITE_DB_PATH = dbPath
process.env.MINIAPP_JWT_SECRET = 'ui-polish-local-miniapp-secret-0000000000'
process.env.ADMIN_TOKEN_SECRET = 'ui-polish-local-admin-secret-000000000000'

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message)
}

function cleanupDb() {
  for (const path of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
    try { unlinkSync(path) } catch {}
  }
}

async function createUser(repo: Repository<User>, suffix: string = randomUUID()) {
  return repo.save(repo.create({
    id: `user_${suffix}`,
    wechatAppId: 'mock-app',
    openid: `openid_${suffix}`,
    nickname: `行者${suffix.slice(0, 6)}`,
    registeredAt: new Date(),
    status: 'ACTIVE',
    isMember: false,
    isLifetimeMember: false,
  } as any) as unknown as User)
}

async function createActivity(repo: Repository<Activity>, city: string, status = 'PUBLISHED') {
  const now = Date.now()
  return repo.save(repo.create({
    title: `${city}-${randomUUID()}`,
    description: 'ui polish smoke',
    province: city === '杭州' ? '浙江' : '北京',
    city,
    cityName: city,
    location: `${city}集合点`,
    locationName: `${city}集合点`,
    locationLat: city === '杭州' ? 30.2741 : 39.9042,
    locationLng: city === '杭州' ? 120.1551 : 116.4074,
    startTime: new Date(now - 172800000),
    endTime: new Date(now - 86400000),
    registrationStartTime: new Date(now - 259200000),
    registrationEndTime: new Date(now - 200000000),
    capacity: 10,
    status,
    paymentMode: 'FULL',
    price: 100,
  } as any) as unknown as Activity)
}

async function main() {
  cleanupDb()
  const { AppModule } = await import('../src/app.module')
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false })
  const dataSource = app.get(DataSource)
  const userRepo = dataSource.getRepository(User)
  const activityRepo = dataSource.getRepository(Activity)
  const regRepo = dataSource.getRepository(ActivityRegistration)
  const usersService = app.get(UsersService)
  const usersController = app.get(UsersController)

  const user = await createUser(userRepo, 'ui-polish')
  const beijingA = await createActivity(activityRepo, '北京')
  const beijingB = await createActivity(activityRepo, '北京')
  const hangzhou = await createActivity(activityRepo, '杭州')

  await regRepo.save(regRepo.create({ userId: user.id, activityId: beijingA.id, status: 'CHECKED_IN', checkedInAt: new Date() } as any))
  await regRepo.save(regRepo.create({ userId: user.id, activityId: beijingB.id, status: 'CHECKED_IN', checkedInAt: new Date() } as any))
  await regRepo.save(regRepo.create({ userId: user.id, activityId: hangzhou.id, status: 'PAID' } as any))

  const cities = await usersService.getJourneyCities(user.id)
  assert(cities.length === 1, 'journey cities should only include checked-in cities with dedupe')
  assert(cities[0].city === '北京', 'journey cities should include the checked-in city')
  assert(cities[0].activityCount === 2, 'journey city activityCount should aggregate checked-in activities')
  assert(cities[0].latitude === 39.9042 && cities[0].longitude === 116.4074, 'journey city should expose coordinates')

  const fromController = await usersController.getMyJourneyCities({ userId: user.id, tokenType: 'miniapp' })
  assert(Array.isArray(fromController) && fromController.length === 1, 'controller should expose journey city list')

  console.log('V2.9 UI final polish smoke PASS')
  await app.close()
  cleanupDb()
  process.exit(0)
}

main().catch(error => {
  console.error(error?.message || error)
  cleanupDb()
  process.exit(1)
})
