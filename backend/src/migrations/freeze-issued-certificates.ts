import { NestFactory } from '@nestjs/core'
import { DataSource } from 'typeorm'
import { Activity } from '../activity/entities/activity.entity'
import { ActivityRegistrationInfo } from '../activity/entities/activity-registration-info.entity'
import { createCertificateRenderSnapshot } from '../certificate/certificate-renderer'
import { CertificateTemplate } from '../certificate/entities/certificate-template.entity'
import { IssuedCertificate } from '../certificate/entities/issued-certificate.entity'
import { User } from '../users/entities/user.entity'

async function main() {
  const { AppModule } = await import('../app.module')
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] })
  const db = app.get(DataSource)
  const issuedRepo = db.getRepository(IssuedCertificate)
  const activityRepo = db.getRepository(Activity)
  const templateRepo = db.getRepository(CertificateTemplate)
  const userRepo = db.getRepository(User)
  const registrationInfoRepo = db.getRepository(ActivityRegistrationInfo)
  const defaultTemplate = await templateRepo.findOne({ where: { isDefault: true, enabled: true } })
  const certificates = await issuedRepo.find({ order: { createdAt: 'ASC' } })
  let frozen = 0
  let alreadyFrozen = 0

  for (const certificate of certificates) {
    if (certificate.renderSnapshot) {
      alreadyFrozen += 1
      continue
    }
    const [activity, user, registrationInfo] = await Promise.all([
      activityRepo.findOne({ where: { id: certificate.activityId } }),
      userRepo.findOne({ where: { id: certificate.userId } }),
      registrationInfoRepo.findOne({ where: { userId: certificate.userId, activityId: certificate.activityId } }),
    ])
    if (!activity || !user) throw new Error(`Cannot freeze ${certificate.id}: missing user or activity`)
    const template = activity.certificateTemplateId
      ? await templateRepo.findOne({ where: { id: activity.certificateTemplateId } })
      : defaultTemplate
    let renderConfig: Record<string, any> = {}
    if (template?.fieldConfig) {
      try { renderConfig = JSON.parse(template.fieldConfig) } catch { renderConfig = {} }
    }
    const snapshot = createCertificateRenderSnapshot({
      templateId: template?.id || null,
      templateUpdatedAt: template?.updatedAt || null,
      backgroundImageUrl: template?.imageUrl || '',
      renderConfig,
      recipientName: registrationInfo?.realName || user.nickname || '行者',
      activityName: activity.title,
      activityLocation: activity.locationName || activity.location || activity.city || '',
      activityEndAt: activity.endTime || null,
      activitySlogan: activity.slogan || '',
      issuedAt: certificate.issuedAt,
    })
    certificate.templateId = snapshot.templateId
    certificate.renderSnapshot = JSON.stringify(snapshot)
    await issuedRepo.save(certificate)
    frozen += 1
  }

  console.log(JSON.stringify({ total: certificates.length, frozen, alreadyFrozen }))
  await app.close()
}

main().then(() => process.exit(0)).catch(error => {
  console.error(error?.message || error)
  process.exit(1)
})
