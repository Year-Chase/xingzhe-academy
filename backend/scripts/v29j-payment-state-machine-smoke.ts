import { randomUUID } from 'crypto'
import { unlinkSync } from 'fs'
import { NestFactory } from '@nestjs/core'
import { DataSource, Repository } from 'typeorm'
import { Activity } from '../src/activity/entities/activity.entity'
import { ActivityRegistration } from '../src/activity/entities/activity-registration.entity'
import { ActivityOrder } from '../src/activity/entities/activity-order.entity'
import { ActivityQR } from '../src/activity/entities/activity-qr.entity'
import { ActivityFlowService } from '../src/activity/activity-flow.service'
import { User } from '../src/users/entities/user.entity'
import { PaymentTransaction, PaymentTradeType } from '../src/payment/entities/payment-transaction.entity'
import { yuanToCentsStrict } from '../src/payment/money'

const dbPath = `/private/tmp/xingzhe-v29j-${process.pid}-${randomUUID()}.db`
process.env.SQLITE_DB_PATH = dbPath
process.env.MINIAPP_JWT_SECRET = 'v29j-local-miniapp-secret-0000000000'
process.env.ADMIN_TOKEN_SECRET = 'v29j-local-admin-secret-000000000000'

type Repos = {
  activity: Repository<Activity>
  registration: Repository<ActivityRegistration>
  order: Repository<ActivityOrder>
  qr: Repository<ActivityQR>
  user: Repository<User>
  paymentTx: Repository<PaymentTransaction>
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message)
}

function assertThrows(work: () => unknown, message: string) {
  try {
    work()
  } catch {
    return
  }
  throw new Error(message)
}

function cleanupDb() {
  for (const path of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
    try { unlinkSync(path) } catch {}
  }
}

function cents(amount: number) {
  return yuanToCentsStrict(String(amount))
}

async function createUser(repo: Repository<User>, suffix: string = randomUUID()) {
  return repo.save(repo.create({
    id: `v29j_user_${suffix}`,
    wechatAppId: 'mock-app',
    openid: `v29j_openid_${suffix}`,
    nickname: `行者${suffix.slice(0, 6)}`,
    registeredAt: new Date(),
    status: 'ACTIVE',
    isMember: false,
    isLifetimeMember: false,
  } as any) as unknown as User)
}

async function createActivity(repo: Repository<Activity>, paymentMode: string, capacity = 20) {
  const now = Date.now()
  return repo.save(repo.create({
    title: `${paymentMode}-${randomUUID()}`,
    description: 'v29j smoke',
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
  } as any) as unknown as Activity)
}

async function createPaymentCase(
  repos: Repos,
  input: {
    user: User
    activity: Activity
    tradeType: PaymentTradeType
    amount: number
    payType?: string
    postpayAmount?: number
    txStatus?: PaymentTransaction['status']
    orderStatus?: ActivityOrder['status']
    registrationStatus?: ActivityRegistration['status']
  },
) {
  const registration = await repos.registration.save(repos.registration.create({
    userId: input.user.id,
    activityId: input.activity.id,
    status: input.registrationStatus || 'REGISTERED',
  } as any) as unknown as ActivityRegistration)
  const order = await repos.order.save(repos.order.create({
    userId: input.user.id,
    activityId: input.activity.id,
    registrationId: registration.id,
    amount: input.amount,
    status: input.orderStatus || 'PENDING',
    payType: (input.payType || input.tradeType) as any,
    paidAt: null,
    fullAmount: input.payType === 'PREPAY' ? 100 : input.amount,
    orderPrepayAmount: input.payType === 'PREPAY' ? 30 : null,
    orderPostpayAmount: input.postpayAmount ?? null,
    postpayStatus: input.payType === 'PREPAY' && (input.postpayAmount || 0) > 0 ? 'UNPAID' : 'NONE',
  } as any) as unknown as ActivityOrder)
  const tx = await repos.paymentTx.save(repos.paymentTx.create({
    orderId: String(order.id),
    registrationId: String(registration.id),
    userId: input.user.id,
    activityId: String(input.activity.id),
    tradeType: input.tradeType,
    paymentProvider: 'MOCK',
    merchantOrderNo: `MOCK${input.tradeType}${randomUUID().replace(/-/g, '').slice(0, 20)}`,
    providerTransactionNo: null,
    amount: input.amount,
    amountCents: cents(input.amount),
    status: input.txStatus || 'INIT',
    paidAt: null,
    notifyAt: null,
  } as any) as unknown as PaymentTransaction)
  return { registration, order, tx }
}

async function activeQrCount(repos: Repos, registrationId: number) {
  return repos.qr.count({ where: { registrationId, status: 'ACTIVE' as any } })
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
    qr: dataSource.getRepository(ActivityQR),
    user: dataSource.getRepository(User),
    paymentTx: dataSource.getRepository(PaymentTransaction),
  }
  const flow = app.get(ActivityFlowService)

  assert(yuanToCentsStrict('0.01') === 1, '0.01 cents conversion failed')
  assert(yuanToCentsStrict('0.10') === 10, '0.10 cents conversion failed')
  assert(yuanToCentsStrict('1.23') === 123, '1.23 cents conversion failed')
  assert(yuanToCentsStrict('8999.99') === 899999, '8999.99 cents conversion failed')
  assertThrows(() => yuanToCentsStrict('1.234'), '3-decimal amount was accepted')
  assertThrows(() => yuanToCentsStrict('not-a-number'), 'invalid amount string was accepted')
  assertThrows(() => yuanToCentsStrict('-1'), 'negative amount was accepted')

  const fullActivity = await createActivity(repos.activity, 'FULL')
  const prepayActivity = await createActivity(repos.activity, 'PREPAY')
  const postpayActivity = await createActivity(repos.activity, 'POSTPAY')
  const userFull = await createUser(repos.user, 'full')
  const userPrepay = await createUser(repos.user, 'prepay')
  const userPostpay = await createUser(repos.user, 'postpay')
  const userMismatch = await createUser(repos.user, 'mismatch')
  const userFailed = await createUser(repos.user, 'failed')
  const userClosed = await createUser(repos.user, 'closed')
  const userRollback = await createUser(repos.user, 'rollback')
  const userMock = await createUser(repos.user, 'mock')
  const userLegacy = await createUser(repos.user, 'legacy')

  const fullCase = await createPaymentCase(repos, { user: userFull, activity: fullActivity, tradeType: 'FULL', amount: 100 })
  await repos.paymentTx.save(repos.paymentTx.create({
    orderId: String(fullCase.order.id),
    registrationId: String(fullCase.registration.id),
    userId: userFull.id,
    activityId: String(fullActivity.id),
    tradeType: 'FULL',
    paymentProvider: 'MOCK',
    merchantOrderNo: `MOCKDUP${randomUUID().replace(/-/g, '').slice(0, 20)}`,
    providerTransactionNo: null,
    amount: 100,
    amountCents: cents(100),
    status: 'INIT',
  } as any) as unknown as PaymentTransaction).then(
    () => { throw new Error('(orderId, tradeType) duplicate transaction was accepted') },
    () => undefined,
  )
  const first = await flow.applyPaymentSuccess({
    merchantOrderNo: fullCase.tx.merchantOrderNo,
    providerTransactionNo: 'mock_provider_full',
    amountCents: cents(100),
    orderId: fullCase.order.id,
    tradeType: 'FULL',
    paymentProvider: 'MOCK',
    paidAt: new Date(),
  })
  assert(first.status === 'SUCCESS' && first.alreadyProcessed === false, 'FULL first success failed')
  for (let i = 0; i < 10; i += 1) {
    const repeat = await flow.applyPaymentSuccess({
      merchantOrderNo: fullCase.tx.merchantOrderNo,
      providerTransactionNo: 'mock_provider_full',
      amountCents: cents(100),
      orderId: fullCase.order.id,
      tradeType: 'FULL',
      paymentProvider: 'MOCK',
      paidAt: new Date(),
    })
    assert(repeat.status === 'SUCCESS' && repeat.alreadyProcessed === true, 'repeat success was not idempotent')
  }
  assert(await activeQrCount(repos, fullCase.registration.id) === 1, 'idempotent success created duplicate active QR')
  assert((await repos.registration.findOneByOrFail({ id: fullCase.registration.id })).status === 'PAID', 'FULL registration not eligible')
  assert((await repos.order.findOneByOrFail({ id: fullCase.order.id })).status === 'PAID', 'FULL order not paid')
  assert((await repos.paymentTx.findOneByOrFail({ id: fullCase.tx.id })).status === 'SUCCESS', 'FULL tx not success')

  const prepayCase = await createPaymentCase(repos, { user: userPrepay, activity: prepayActivity, tradeType: 'PREPAY', amount: 30, payType: 'PREPAY', postpayAmount: 70 })
  await flow.applyPaymentSuccess({
    merchantOrderNo: prepayCase.tx.merchantOrderNo,
    providerTransactionNo: 'mock_provider_prepay',
    amountCents: cents(30),
    orderId: prepayCase.order.id,
    tradeType: 'PREPAY',
    paymentProvider: 'MOCK',
  })
  const prepayOrder = await repos.order.findOneByOrFail({ id: prepayCase.order.id })
  assert(prepayOrder.status === 'PAID', 'PREPAY order was not paid')
  assert(prepayOrder.postpayStatus === 'UNPAID', 'PREPAY success incorrectly marked postpay paid')
  assert((await repos.qr.findOneByOrFail({ registrationId: prepayCase.registration.id, status: 'ACTIVE' as any })).stage === 'PREPAY', 'PREPAY QR stage mismatch')

  const pendingPostpay = await createPaymentCase(repos, {
    user: await createUser(repos.user, 'pending-postpay'),
    activity: prepayActivity,
    tradeType: 'POSTPAY',
    amount: 70,
    payType: 'PREPAY',
    postpayAmount: 70,
  })
  await flow.applyPaymentSuccess({
    merchantOrderNo: pendingPostpay.tx.merchantOrderNo,
    providerTransactionNo: 'mock_provider_pending_postpay',
    amountCents: cents(70),
    orderId: pendingPostpay.order.id,
    tradeType: 'POSTPAY',
    paymentProvider: 'MOCK',
  }).then(
    () => { throw new Error('POSTPAY succeeded before PREPAY was complete') },
    () => undefined,
  )
  assert((await repos.order.findOneByOrFail({ id: pendingPostpay.order.id })).postpayStatus !== 'PAID', 'pending PREPAY order was marked postpay paid')
  assert((await repos.registration.findOneByOrFail({ id: pendingPostpay.registration.id })).status === 'REGISTERED', 'pending PREPAY registration changed')
  assert(await activeQrCount(repos, pendingPostpay.registration.id) === 0, 'pending PREPAY created POSTPAY QR')

  const postpayTx = await repos.paymentTx.save(repos.paymentTx.create({
    orderId: String(prepayCase.order.id),
    registrationId: String(prepayCase.registration.id),
    userId: userPrepay.id,
    activityId: String(prepayActivity.id),
    tradeType: 'POSTPAY',
    paymentProvider: 'MOCK',
    merchantOrderNo: `MOCKPOSTPAY${randomUUID().replace(/-/g, '').slice(0, 18)}`,
    providerTransactionNo: null,
    amount: 70,
    amountCents: cents(70),
    status: 'INIT',
  } as any) as unknown as PaymentTransaction)
  await flow.applyPaymentSuccess({
    merchantOrderNo: postpayTx.merchantOrderNo,
    providerTransactionNo: 'mock_provider_postpay',
    amountCents: cents(70),
    orderId: prepayCase.order.id,
    tradeType: 'POSTPAY',
    paymentProvider: 'MOCK',
  })
  const postpayDoneOrder = await repos.order.findOneByOrFail({ id: prepayCase.order.id })
  assert(postpayDoneOrder.postpayStatus === 'PAID', 'POSTPAY did not mark tail paid')
  assert(await repos.registration.count({ where: { userId: userPrepay.id, activityId: prepayActivity.id } }) === 1, 'POSTPAY created another registration')
  assert(await activeQrCount(repos, prepayCase.registration.id) === 1, 'POSTPAY created duplicate active QR')
  assert((await repos.qr.findOneByOrFail({ registrationId: prepayCase.registration.id, status: 'ACTIVE' as any })).stage === 'POSTPAY', 'POSTPAY QR stage mismatch')

  const postpayInitial = await createPaymentCase(repos, { user: userPostpay, activity: postpayActivity, tradeType: 'POSTPAY', amount: 100, payType: 'POSTPAY' })
  await flow.applyPaymentSuccess({
    merchantOrderNo: postpayInitial.tx.merchantOrderNo,
    providerTransactionNo: 'mock_provider_initial_postpay',
    amountCents: cents(100),
    orderId: postpayInitial.order.id,
    tradeType: 'POSTPAY',
    paymentProvider: 'MOCK',
  })
  assert((await repos.registration.findOneByOrFail({ id: postpayInitial.registration.id })).status === 'PAID', 'POSTPAY initial registration not eligible')

  const mockResult = await flow.enrollPay(userMock.id, fullActivity.id)
  assert(mockResult.status === 'PAID', 'mock enroll did not return PAID')
  const mockTx = await repos.paymentTx.findOneByOrFail({ orderId: String(mockResult.orderId), tradeType: 'FULL' as any })
  assert(mockTx.status === 'SUCCESS' && mockTx.paymentProvider === 'MOCK', 'mock flow did not persist successful PaymentTransaction')

  const amountMismatch = await createPaymentCase(repos, { user: userMismatch, activity: fullActivity, tradeType: 'FULL', amount: 100 })
  await flow.applyPaymentSuccess({
    merchantOrderNo: amountMismatch.tx.merchantOrderNo,
    amountCents: cents(101),
    orderId: amountMismatch.order.id,
    tradeType: 'FULL',
  }).then(
    () => { throw new Error('amount mismatch did not reject') },
    () => undefined,
  )
  assert((await repos.order.findOneByOrFail({ id: amountMismatch.order.id })).status === 'PENDING', 'amount mismatch changed order')
  assert((await repos.registration.findOneByOrFail({ id: amountMismatch.registration.id })).status === 'REGISTERED', 'amount mismatch changed registration')
  assert(await activeQrCount(repos, amountMismatch.registration.id) === 0, 'amount mismatch created QR')

  await flow.applyPaymentSuccess({
    merchantOrderNo: amountMismatch.tx.merchantOrderNo,
    amountCents: cents(100),
    orderId: fullCase.order.id,
    tradeType: 'FULL',
  }).then(
    () => { throw new Error('order mismatch did not reject') },
    () => undefined,
  )

  const failedCase = await createPaymentCase(repos, { user: userFailed, activity: fullActivity, tradeType: 'FULL', amount: 100, txStatus: 'FAILED' })
  await flow.applyPaymentSuccess({
    merchantOrderNo: failedCase.tx.merchantOrderNo,
    amountCents: cents(100),
    orderId: failedCase.order.id,
    tradeType: 'FULL',
  }).then(
    () => { throw new Error('FAILED transaction granted eligibility') },
    () => undefined,
  )
  assert((await repos.order.findOneByOrFail({ id: failedCase.order.id })).status === 'PENDING', 'FAILED changed order')
  assert((await repos.registration.findOneByOrFail({ id: failedCase.registration.id })).status === 'REGISTERED', 'FAILED changed registration')

  const closedCase = await createPaymentCase(repos, { user: userClosed, activity: fullActivity, tradeType: 'FULL', amount: 100, txStatus: 'CLOSED' })
  await flow.applyPaymentSuccess({
    merchantOrderNo: closedCase.tx.merchantOrderNo,
    amountCents: cents(100),
    orderId: closedCase.order.id,
    tradeType: 'FULL',
  }).then(
    () => { throw new Error('CLOSED transaction granted eligibility') },
    () => undefined,
  )
  assert((await repos.order.findOneByOrFail({ id: closedCase.order.id })).status === 'PENDING', 'CLOSED changed order')
  assert((await repos.registration.findOneByOrFail({ id: closedCase.registration.id })).status === 'REGISTERED', 'CLOSED changed registration')

  const rollbackCase = await createPaymentCase(repos, { user: userRollback, activity: fullActivity, tradeType: 'FULL', amount: 100 })
  const originalCreateQR = (flow as any).createRegistrationQR
  ;(flow as any).createRegistrationQR = async () => { throw new Error('forced qr failure') }
  await flow.applyPaymentSuccess({
    merchantOrderNo: rollbackCase.tx.merchantOrderNo,
    amountCents: cents(100),
    orderId: rollbackCase.order.id,
    tradeType: 'FULL',
  }).then(
    () => { throw new Error('forced QR failure did not reject') },
    () => undefined,
  )
  ;(flow as any).createRegistrationQR = originalCreateQR
  assert((await repos.paymentTx.findOneByOrFail({ id: rollbackCase.tx.id })).status === 'INIT', 'rollback left tx success')
  assert((await repos.order.findOneByOrFail({ id: rollbackCase.order.id })).status === 'PENDING', 'rollback changed order')
  assert((await repos.registration.findOneByOrFail({ id: rollbackCase.registration.id })).status === 'REGISTERED', 'rollback changed registration')
  assert(await activeQrCount(repos, rollbackCase.registration.id) === 0, 'rollback left QR')

  const legacyReg = await repos.registration.save(repos.registration.create({ userId: userLegacy.id, activityId: fullActivity.id, status: 'PAID' } as any) as unknown as ActivityRegistration)
  const legacyOrder = await repos.order.save(repos.order.create({ userId: userLegacy.id, activityId: fullActivity.id, registrationId: legacyReg.id, amount: 0, status: 'PAID', payType: 'FULL', paidAt: new Date() } as any) as unknown as ActivityOrder)
  const legacyRead = await flow.getOrderForUser(legacyOrder.id, userLegacy.id)
  assert(legacyRead.status === 'PAID', 'legacy mock order could not be read')

  console.log('V2.9J payment state machine smoke PASS')
  await app.close()
  cleanupDb()
  process.exit(0)
}

main().catch(error => {
  console.error(error?.message || error)
  cleanupDb()
  process.exit(1)
})
