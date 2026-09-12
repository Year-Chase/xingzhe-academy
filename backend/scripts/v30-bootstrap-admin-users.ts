import { randomBytes } from 'crypto'
import { NestFactory } from '@nestjs/core'
import { DataSource } from 'typeorm'
import { AdminAuthService } from '../src/auth/admin-auth.service'
import { AdminUser } from '../src/auth/entities/admin-user.entity'
import { loadEnv } from '../src/config/env'

const TEMPORARY_ADMINS = ['suheqi', 'chaoyang', 'yanjun', 'chentiezheng']
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'

function createId() {
  return `adm_${randomBytes(9).toString('base64url')}`
}

function createTemporaryPassword() {
  const bytes = randomBytes(18)
  let result = ''
  for (const byte of bytes) result += alphabet[byte % alphabet.length]
  return result
}

async function main() {
  loadEnv()
  const legacyUsername = String(process.env.ADMIN_USERNAME || '').trim()
  const legacyPassword = String(process.env.ADMIN_PASSWORD || '')
  if (legacyUsername !== 'chentiezheng' || !legacyPassword) throw new Error('旧管理员凭证无法安全确认，初始化已停止')

  const { AppModule } = await import('../src/app.module')
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false })
  const db = app.get(DataSource)
  const admins = db.getRepository(AdminUser)
  const passwords = new Map<string, string>()
  const passwordService = app.get(AdminAuthService)

  await db.transaction(async (manager) => {
    const repo = manager.getRepository(AdminUser)
    let system = await repo.findOne({ where: { username: 'chentiezheng1' } })
    const legacy = await repo.findOne({ where: { username: 'chentiezheng' } })
    if (!system && legacy) {
      legacy.username = 'chentiezheng1'
      legacy.role = 'SUPER_ADMIN'
      legacy.status = 'ACTIVE'
      legacy.isSystemAccount = true
      legacy.mustChangePassword = false
      system = await repo.save(legacy)
    }
    if (!system) {
      system = repo.create({ id: createId(), username: 'chentiezheng1', passwordHash: await passwordService.hashPassword(legacyPassword), role: 'SUPER_ADMIN', status: 'ACTIVE', mustChangePassword: false, isSystemAccount: true, lastLoginAt: null })
      await repo.save(system)
    }
    for (const username of TEMPORARY_ADMINS) {
      const existing = await repo.findOne({ where: { username } })
      if (existing) continue
      const password = createTemporaryPassword()
      passwords.set(username, password)
      await repo.save(repo.create({ id: createId(), username, passwordHash: await passwordService.hashPassword(password), role: 'ADMIN', status: 'ACTIVE', mustChangePassword: true, isSystemAccount: false, lastLoginAt: null }))
    }
  })

  const expected = await admins.count({ where: { status: 'ACTIVE' } })
  if (expected < 5) throw new Error('管理员初始化未完成')
  await app.close()
  process.stdout.write(JSON.stringify({ createdTemporaryPasswords: Object.fromEntries(passwords) }) + '\n')
}

main().catch((error) => { console.error(error?.message || error); process.exit(1) })
