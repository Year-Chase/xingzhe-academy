import { randomUUID } from 'crypto'
import { unlinkSync } from 'fs'
import { NestFactory } from '@nestjs/core'
import { DataSource, Repository } from 'typeorm'
import { Activity } from '../src/activity/entities/activity.entity'
import { ActivityRegistration } from '../src/activity/entities/activity-registration.entity'
import { ActivityOrder } from '../src/activity/entities/activity-order.entity'
import { ActivityRefund } from '../src/activity/entities/activity-refund.entity'
import { ActivityFlowService } from '../src/activity/activity-flow.service'
import { ActivityController } from '../src/activity/activity.controller'
import { User } from '../src/users/entities/user.entity'

const dbPath = `/private/tmp/xingzhe-v29i-${process.pid}-${randomUUID()}.db`
process.env.SQLITE_DB_PATH = dbPath
process.env.MINIAPP_JWT_SECRET = 'v29i-local-miniapp-secret-0000000000'
process.env.ADMIN_TOKEN_SECRET = 'v29i-local-admin-secret-000000000000'

type Repos = {
  activity: Repository<Activity>
  registration: Repository<ActivityRegistration>
  order: Repository<ActivityOrder>
  refund: Repository<ActivityRefund>
  user: Repository<User>
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message)
}

function cleanupDb() {
  for (const path of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
    try { unlinkSync(path) } catch {}
  }
}

async function createActivity(repo: Repository<Activity>, paymentMode: string, capacity = 5): Promise<Activity> {
  const now = Date.now()
  return repo.save(repo.create({
    title: `${paymentMode}-${randomUUID()}`,
    description: 'smoke',
    location: '北京',
    startTime: new Date(now + 86400000),
    endTime: new Date(now + 90000000),
    registrationStartTime: new Date(now - 3600000),
    registrationEndTime: new Date(now + 3600000),
    capacity,
    status: 'PUBLISHED',
    paymentMode,
    price: 100,
    prepayAmount: paymentMode === 'PREPAY' ? 30 : 0,
    remainingAmount: paymentMode === 'PREPAY' ? 70 : 0,
    groupQrType: 'WECHAT',
    groupQrImageUrl: 'https://example.test/group-qr.png',
    groupQrTitle: '加入活动群',
    groupQrDescription: '活动通知',
  } as any) as unknown as Activity)
}

async function createUser(repo: Repository<User>, suffix: string = randomUUID()): Promise<User> {
  return repo.save(repo.create({
    id: `user_${suffix}`,
    openid: `openid_${suffix}`,
    nickname: `行者${suffix.slice(0, 6)}`,
    registeredAt: new Date(),
    status: 'ACTIVE',
    isMember: false,
    isLifetimeMember: false,
  } as any) as unknown as User)
}

async function counts(repos: Repos, activityId: number, userId?: string) {
  const where = userId ? { activityId, userId } : { activityId }
  return {
    registrations: await repos.registration.count({ where }),
    orders: await repos.order.count({ where: userId ? { activityId, userId } : { activityId } }),
  }
}

async function main() {
  cleanupDb()
  const { AppModule } = await import('../src/app.module')
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false })
  const dataSource = app.get(DataSource)
  const repos: Repos = {
    activity: dataSource.getRepository(Activity),
    registration: dataSource.getRepository(ActivityRegistration),
    order: dataSource.getRepository(ActivityOrder),
    refund: dataSource.getRepository(ActivityRefund),
    user: dataSource.getRepository(User),
  }
  const flow = app.get(ActivityFlowService)
  const controller = app.get(ActivityController)

  const full = await createActivity(repos.activity, 'FULL')
  const prepay = await createActivity(repos.activity, 'PREPAY')
  const postpay = await createActivity(repos.activity, 'POSTPAY')
  const capacityOne = await createActivity(repos.activity, 'FULL', 1)
  const rollbackActivity = await createActivity(repos.activity, 'FULL')

  const userA = await createUser(repos.user, 'a')
  const userB = await createUser(repos.user, 'b')
  const userC = await createUser(repos.user, 'c')
  const userD = await createUser(repos.user, 'd')
  const intruder = await createUser(repos.user, 'intruder')

  const first = await flow.enrollPay(userA.id, full.id)
  const second = await flow.enrollPay(userA.id, full.id)
  assert(first.id === second.id, 'same user sequential enrollment should reuse registration')
  assert((await counts(repos, full.id, userA.id)).registrations === 1, 'sequential duplicate created registrations')
  assert((await counts(repos, full.id, userA.id)).orders === 1, 'sequential duplicate created orders')

  const concurrentSameUser = await Promise.allSettled([
    flow.enrollPay(userB.id, prepay.id),
    flow.enrollPay(userB.id, prepay.id),
  ])
  assert(concurrentSameUser.every(r => r.status === 'fulfilled'), 'same user concurrent enrollment should not fail')
  assert((await counts(repos, prepay.id, userB.id)).registrations === 1, 'same user concurrent enrollment created registrations')
  assert((await counts(repos, prepay.id, userB.id)).orders === 1, 'same user concurrent enrollment created orders')

  const capacityRace = await Promise.allSettled([
    flow.enrollPay(userC.id, capacityOne.id),
    flow.enrollPay(userD.id, capacityOne.id),
  ])
  assert(capacityRace.filter(r => r.status === 'fulfilled').length === 1, 'capacity=1 race should allow exactly one success')
  assert(capacityRace.filter(r => r.status === 'rejected').length === 1, 'capacity=1 race should reject exactly one request')
  assert((await counts(repos, capacityOne.id)).registrations === 1, 'capacity=1 race persisted more than one registration')
  assert((await counts(repos, capacityOne.id)).orders === 1, 'capacity=1 race persisted more than one order')

  const originalCreateQR = (flow as any).createRegistrationQR
  ;(flow as any).createRegistrationQR = async () => { throw new Error('forced qr failure') }
  await flow.enrollPay(intruder.id, rollbackActivity.id).then(
    () => { throw new Error('forced failure did not reject') },
    () => undefined,
  )
  ;(flow as any).createRegistrationQR = originalCreateQR
  assert((await counts(repos, rollbackActivity.id, intruder.id)).registrations === 0, 'rollback left registration behind')
  assert((await counts(repos, rollbackActivity.id, intruder.id)).orders === 0, 'rollback left order behind')

  const postpayResult = await flow.enrollPay(intruder.id, postpay.id)
  assert(postpayResult.status === 'PAID', 'POSTPAY smoke should keep existing paid enrollment semantics')

  const publicDetail = await controller.getActivityDetail(full.id)
  assert(!Object.prototype.hasOwnProperty.call(publicDetail, 'groupQrImageUrl'), 'public detail leaked groupQrImageUrl')
  assert(publicDetail.hasGroupQr === true, 'public detail should expose hasGroupQr')

  await flow.getGroupQrForUser('missing_user', full.id).then(
    () => { throw new Error('unregistered user could read group QR') },
    () => undefined,
  )
  const groupQr = await flow.getGroupQrForUser(userA.id, full.id)
  assert(groupQr.groupQrImageUrl === 'https://example.test/group-qr.png', 'eligible user could not read group QR')
  await repos.refund.save(repos.refund.create({
    orderId: first.orderId,
    userId: userA.id,
    activityId: full.id,
    amount: 100,
    reason: 'full refund smoke',
    status: 'SUCCESS',
  } as any) as unknown as ActivityRefund)
  await (controller as any).getGroupQR(full.id, { userId: userA.id }).then(
    () => { throw new Error('fully refunded user could read group QR') },
    () => undefined,
  )
  await flow.getGroupQrForUser(userA.id, prepay.id).then(
    () => { throw new Error('user read another activity group QR') },
    () => undefined,
  )

  console.log('V2.9I registration and group QR smoke PASS')
  await app.close()
  cleanupDb()
  process.exit(0)
}

main().catch(error => {
  console.error(error?.message || error)
  cleanupDb()
  process.exit(1)
})
