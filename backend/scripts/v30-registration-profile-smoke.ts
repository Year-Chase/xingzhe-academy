import 'reflect-metadata'
import * as assert from 'node:assert/strict'
import { DataSource } from 'typeorm'
import { ActivityRegistrationInfo } from '../src/activity/entities/activity-registration-info.entity'
import { UserRegistrationProfile } from '../src/users/entities/user-registration-profile.entity'

const ALL_FIELDS = [
  'realName',
  'phone',
  'residentialAddress',
  'departureCity',
  'idCardNo',
  'transportPreference',
  'roomPreference',
  'organization',
  'jobTitle',
  'inviterName',
] as const

function maskIdCardNo(value: string | null): string | null {
  if (!value) return null
  return value.length >= 8 ? value.slice(0, 3) + '***********' + value.slice(-4).toUpperCase() : value
}

async function main() {
  const ds = new DataSource({
    type: 'better-sqlite3',
    database: ':memory:',
    entities: [UserRegistrationProfile, ActivityRegistrationInfo],
    synchronize: true,
  })
  await ds.initialize()
  try {
    const profileRepo = ds.getRepository(UserRegistrationProfile)
    const infoRepo = ds.getRepository(ActivityRegistrationInfo)

    const profile = await profileRepo.save(profileRepo.create({
      userId: 'usr_profile0001',
      realName: '张三',
      phone: '13800138000',
      residentialAddress: '北京市朝阳区',
      departureCity: '北京',
      idCardNo: '110101199001011234',
      transportPreference: '高铁',
      roomPreference: '拼房',
      organization: '行者测试公司',
      jobTitle: '产品经理',
      inviterName: '李四',
    }))

    for (const field of ALL_FIELDS) {
      assert.ok(Object.prototype.hasOwnProperty.call(profile, field), `${field} should exist on reusable profile`)
    }

    const snapshot = await infoRepo.save(infoRepo.create({
      id: 'reginfo_profile0001',
      activityId: 301,
      registrationId: 501,
      userId: profile.userId,
      realName: profile.realName,
      phone: profile.phone,
      residentialAddress: profile.residentialAddress,
      departureCity: profile.departureCity,
      idCardNo: profile.idCardNo,
      transportPreference: profile.transportPreference,
      roomPreference: profile.roomPreference,
      organization: profile.organization,
      jobTitle: profile.jobTitle,
      inviterName: profile.inviterName,
      confirmedAt: new Date('2026-09-12T08:00:00.000Z'),
    }))

    profile.organization = '新公司'
    profile.jobTitle = null
    profile.inviterName = null
    await profileRepo.save(profile)

    const unchangedSnapshot = await infoRepo.findOneByOrFail({ id: snapshot.id })
    assert.equal(unchangedSnapshot.organization, '行者测试公司', 'registration snapshot must not follow later profile changes')
    assert.equal(unchangedSnapshot.jobTitle, '产品经理', 'snapshot jobTitle stays frozen')
    assert.equal(unchangedSnapshot.inviterName, '李四', 'snapshot inviter stays frozen')
    assert.equal(maskIdCardNo(unchangedSnapshot.idCardNo), '110***********1234', 'admin id card display is masked')

    const updatedProfile = await profileRepo.findOneByOrFail({ userId: profile.userId })
    assert.equal(updatedProfile.organization, '新公司', 'profile keeps latest value')
    assert.equal(updatedProfile.jobTitle, null, 'optional profile field can be cleared')
    assert.equal(updatedProfile.inviterName, null, 'optional inviter can be cleared')

    console.log('v30 registration profile smoke passed')
  } finally {
    await ds.destroy()
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
