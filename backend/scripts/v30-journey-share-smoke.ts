import * as assert from 'node:assert/strict'
import { existsSync, readFileSync, rmSync } from 'fs'
import { randomUUID } from 'crypto'
import { NestFactory } from '@nestjs/core'
import { DataSource } from 'typeorm'
import { Activity } from '../src/activity/entities/activity.entity'
import { ActivityOrder } from '../src/activity/entities/activity-order.entity'
import { ActivityRegistration } from '../src/activity/entities/activity-registration.entity'
import { CertificateTemplate } from '../src/certificate/entities/certificate-template.entity'
import { CertificateService } from '../src/certificate/certificate.service'
import { CERTIFICATE_TEMPLATE_MAX_BYTES, validateCertificateTemplateUpload } from '../src/certificate/certificate.controller'
import { User } from '../src/users/entities/user.entity'
import { UsersService } from '../src/users/users.service'

const root = `/private/tmp/xingzhe-v30-journey-${process.pid}-${randomUUID()}`
process.env.SQLITE_DB_PATH = `${root}.db`
process.env.UPLOAD_DIR = `${root}-uploads`
process.env.MINIAPP_JWT_SECRET = 'v30-journey-local-miniapp-secret-000000'
process.env.ADMIN_TOKEN_SECRET = 'v30-journey-local-admin-secret-0000000'

async function main() {
  assert.equal(validateCertificateTemplateUpload('image/jpeg', CERTIFICATE_TEMPLATE_MAX_BYTES), null, 'valid JPG must be accepted')
  assert.equal(validateCertificateTemplateUpload('image/png', 1024), null, 'valid PNG must be accepted')
  assert.equal(validateCertificateTemplateUpload('image/webp', 1024), '仅支持 JPG、JPEG、PNG 图片', 'invalid MIME must be explicit')
  assert.equal(validateCertificateTemplateUpload('image/png', CERTIFICATE_TEMPLATE_MAX_BYTES + 1), '证书底图不能超过 5MB', 'oversized files must be explicit')
  const { AppModule } = await import('../src/app.module')
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false })
  const db = app.get(DataSource)
  const users = db.getRepository(User)
  const activities = db.getRepository(Activity)
  const registrations = db.getRepository(ActivityRegistration)
  const orders = db.getRepository(ActivityOrder)
  const templates = db.getRepository(CertificateTemplate)
  const user = await users.save(users.create({ id: 'usr_v30_journey', wechatAppId: 'mock-app', openid: 'openid-v30-journey', nickname: '测试行者', registeredAt: new Date(), status: 'ACTIVE' } as User))
  const template = await templates.save(templates.create({
    name: '测试模板', imageUrl: '/uploads/certificate/template.png', enabled: true, isDefault: true,
    fieldConfig: JSON.stringify({
      recipientName: { enabled: true, x: 50, y: 39, fontSize: 66, color: '#2E7D5A', align: 'center' },
      activityName: { enabled: true, x: 50, y: 52, fontSize: 46, color: '#202923', align: 'center' },
      activitySlogan: { enabled: true, x: 50, y: 61, fontSize: 30, color: '#4B564F', align: 'center' },
      city: { enabled: true, x: 44, y: 71, fontSize: 28, color: '#4B564F', align: 'right' },
      activityDate: { enabled: true, x: 56, y: 71, fontSize: 28, color: '#4B564F', align: 'left' },
      certificateNo: { enabled: false, x: 50, y: 82, fontSize: 24, color: '#6B756D', align: 'center' },
    }),
  } as CertificateTemplate))
  const templateService = app.get(CertificateService)
  const renderConfig = {
    recipientName: { enabled: true, x: .32, y: .3, fontFamily: 'serif', fontSize: 72, color: '#16382F', align: 'left' },
    activityName: { enabled: true, x: .32, y: .44, fontFamily: 'sans', fontSize: 46, color: '#202923', align: 'left' },
    city: { enabled: true, x: .32, y: .57, fontFamily: 'sans', fontSize: 28, color: '#4B564F', align: 'left' },
    activityDate: { enabled: true, x: .32, y: .64, fontFamily: 'sans', fontSize: 28, color: '#4B564F', align: 'left' },
    activitySlogan: { enabled: false, x: .32, y: .75, fontFamily: 'cursive', fontSize: 30, color: '#4B564F', align: 'left' },
  }
  await templateService.update(template.id, { imageUrl: template.imageUrl, fieldConfig: renderConfig })
  const persistedTemplate = await templates.findOneByOrFail({ id: template.id })
  assert.deepEqual(JSON.parse(persistedTemplate.fieldConfig), renderConfig, 'template layout must survive an update unchanged')
  const ended = new Date(Date.now() - 86400000)
  const activity = await activities.save(activities.create({ title: '已完成活动', slogan: '向山而行', description: '一段真实的活动说明', location: '北京朝阳公园', city: '北京', certificateTemplateId: template.id, status: 'PUBLISHED', capacity: 10, paymentMode: 'FULL', price: 0, startTime: new Date(Date.now() - 172800000), endTime: ended } as Activity))
  const registration = await registrations.save(registrations.create({ userId: user.id, activityId: activity.id, status: 'CHECKED_IN', createdAt: new Date() } as ActivityRegistration))
  await orders.save(orders.create({ userId: user.id, activityId: activity.id, registrationId: registration.id, status: 'PAID', payType: 'FULL', amount: 0, postpayStatus: 'NONE' } as ActivityOrder))
  const service = app.get(UsersService)
  const journey = await service.getJourney(user.id)
  assert.equal(journey.certificates.length, 1, 'eligible activity should issue one certificate')
  const certificate = journey.certificates[0]
  assert(certificate.certificateImage.includes('/certificate-issued/'), 'certificate list must use issued asset')
  assert(existsSync(`${process.env.UPLOAD_DIR}/certificate-issued/${certificate.certificateId}.svg`), 'issued certificate image is not persisted')
  const asset = readFileSync(`${process.env.UPLOAD_DIR}/certificate-issued/${certificate.certificateId}.svg`, 'utf8')
  assert(asset.includes('width="1754" height="1240"'), 'certificate must use the 1754x1240 template canvas')
  assert(asset.includes('preserveAspectRatio="xMidYMid meet"'), 'certificate template must never be cropped')
  assert(asset.includes('测试行者') && asset.includes('已完成活动') && asset.includes('北京'), 'enabled template fields are missing from the issued image')
  assert(asset.includes('font-family="Songti SC, SimSun, serif"') && asset.includes('text-anchor="start"'), 'saved font and alignment must drive certificate rendering')
  assert(!asset.includes('向山而行') && !asset.includes('XZ-') && !asset.includes('一段真实的活动说明'), 'disabled or non-certificate fields leaked into the issued image')
  assert((certificate.templateRenderConfig as any).recipientName.value === '测试行者', 'journey must expose the frozen field snapshot')
  const snapshotBefore = JSON.stringify(certificate.templateRenderConfig)
  assert(certificate.friendShareImage.includes('-share-friend.svg') && certificate.timelineShareImage.includes('-share-timeline.svg'), 'certificate must return separate share assets')
  const friendShare = readFileSync(`${process.env.UPLOAD_DIR}/certificate-issued/${certificate.certificateId}-share-friend.svg`, 'utf8')
  const timelineShare = readFileSync(`${process.env.UPLOAD_DIR}/certificate-issued/${certificate.certificateId}-share-timeline.svg`, 'utf8')
  assert(friendShare.includes('width="1250" height="1000"') && friendShare.includes('preserveAspectRatio="xMidYMid meet"'), 'friend share cover must be complete 5:4')
  assert(timelineShare.includes('width="1000" height="1000"') && timelineShare.includes('preserveAspectRatio="xMidYMid meet"'), 'timeline share cover must be complete 1:1')

  const v2Config = {
    ...renderConfig,
    recipientName: { ...renderConfig.recipientName, x: .58, color: '#E9654B', fontKey: 'system-medium', fontSize: 104 },
    activitySlogan: { ...renderConfig.activitySlogan, enabled: true, visible: true },
  }
  await templateService.update(template.id, { imageUrl: '/uploads/certificate/template-v2.png', fieldConfig: { canvas: { width: 1754, height: 1240 }, fields: v2Config } })
  activity.title = '2026北京城市山野探索徒步特别活动'
  activity.location = '北京市怀柔区雁栖湖国际徒步基地'
  activity.slogan = '一座城市，也可以很山野'
  await activities.save(activity)
  const sameJourney = await service.getJourney(user.id)
  const sameCertificate = sameJourney.certificates[0]
  const frozenAsset = readFileSync(`${process.env.UPLOAD_DIR}/certificate-issued/${certificate.certificateId}.svg`, 'utf8')
  const frozenFriendShare = readFileSync(`${process.env.UPLOAD_DIR}/certificate-issued/${certificate.certificateId}-share-friend.svg`, 'utf8')
  assert.equal(frozenAsset, asset, 'template edits must not rewrite an issued certificate image')
  assert.equal(frozenFriendShare, friendShare, 'template edits must not rewrite an issued share image')
  assert.equal(JSON.stringify(sameCertificate.templateRenderConfig), snapshotBefore, 'template edits must not change the issued render snapshot')

  const secondUser = await users.save(users.create({ id: 'usr_v30_journey_2', wechatAppId: 'mock-app', openid: 'openid-v30-journey-2', nickname: '第二位行者', registeredAt: new Date(), status: 'ACTIVE' } as User))
  const secondRegistration = await registrations.save(registrations.create({ userId: secondUser.id, activityId: activity.id, status: 'CHECKED_IN', createdAt: new Date() } as ActivityRegistration))
  await orders.save(orders.create({ userId: secondUser.id, activityId: activity.id, registrationId: secondRegistration.id, status: 'PAID', payType: 'FULL', amount: 0, postpayStatus: 'NONE' } as ActivityOrder))
  const secondJourney = await service.getJourney(secondUser.id)
  const secondCertificate = secondJourney.certificates[0]
  const secondAsset = readFileSync(`${process.env.UPLOAD_DIR}/certificate-issued/${secondCertificate.certificateId}.svg`, 'utf8')
  assert(secondAsset.includes('template-v2.png') && secondAsset.includes('#E9654B') && secondAsset.includes('一座城市，也可以很山野'), 'new certificates must use the latest template and business snapshot')
  assert(secondAsset.includes('<tspan') && secondAsset.includes('北京市怀柔区'), 'long text must be rendered through the shared overflow rules')
  assert.notEqual(secondCertificate.certificateId, certificate.certificateId, 'different users must receive independent frozen certificate assets')
  assert.equal(new Date(certificate.activityEndAt!).toISOString().slice(0, 10), ended.toISOString().slice(0, 10), 'certificate list date must come from activity endAt')
  const summary = await service.getMineSummary(user.id)
  assert.deepEqual(Object.keys(summary).sort(), ['certificateCount', 'companionCount', 'journeyCityCount', 'pendingCheckinCount', 'pendingPaymentCount'], 'mine summary fields drifted')
  const publicView = await service.getPublicCertificate(certificate.publicToken)
  assert.deepEqual(Object.keys(publicView).sort(), ['activityDescription', 'activityTitle', 'certificateImage', 'friendShareImage', 'issuedAt', 'location', 'timelineShareImage'], 'public certificate response shape drifted')
  assert.equal(publicView.certificateImage, certificate.certificateImage, 'public detail must keep using the frozen final image')
  assert.equal(publicView.activityTitle, '已完成活动', 'public detail must use the issued activity-name snapshot')
  console.log('V3.0 certificate/share visual smoke PASS')
  await app.close()
}

main().then(() => { rmSync(`${root}.db`, { force: true }); rmSync(`${root}-uploads`, { recursive: true, force: true }); process.exit(0) }).catch(error => { console.error(error?.message || error); rmSync(`${root}.db`, { force: true }); rmSync(`${root}-uploads`, { recursive: true, force: true }); process.exit(1) })
