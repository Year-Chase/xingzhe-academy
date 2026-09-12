import * as assert from 'node:assert/strict'
import { randomUUID } from 'crypto'
import { unlinkSync } from 'fs'
import { NestFactory } from '@nestjs/core'
import { DataSource } from 'typeorm'
import { AdminAuthService } from '../src/auth/admin-auth.service'
import { AdminTokenService } from '../src/auth/admin-token.service'
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard'
import { AdminUser } from '../src/auth/entities/admin-user.entity'

const dbPath = `/private/tmp/xingzhe-v30-admin-auth-${process.pid}-${randomUUID()}.db`
process.env.SQLITE_DB_PATH = dbPath
process.env.MINIAPP_JWT_SECRET = 'v30-admin-auth-local-miniapp-secret-000000'
process.env.ADMIN_TOKEN_SECRET = 'v30-admin-auth-local-token-secret-0000000'
const cleanup = () => [dbPath, `${dbPath}-wal`, `${dbPath}-shm`].forEach((path) => { try { unlinkSync(path) } catch {} })

function context(token: string, path: string) {
  const request: any = { headers: { authorization: `Bearer ${token}` }, path }
  return { switchToHttp: () => ({ getRequest: () => request }) } as any
}

async function main() {
  cleanup()
  const { AppModule } = await import('../src/app.module')
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false })
  const db = app.get(DataSource)
  const admins = db.getRepository(AdminUser)
  const auth = app.get(AdminAuthService)
  const tokens = app.get(AdminTokenService)
  const guard = app.get(JwtAuthGuard)
  const system = await admins.save(admins.create({ id: 'adm_system', username: 'chentiezheng1', passwordHash: await auth.hashPassword('System-pass-123'), role: 'SUPER_ADMIN', status: 'ACTIVE', mustChangePassword: false, isSystemAccount: true } as unknown as AdminUser))
  const temp = await admins.save(admins.create({ id: 'adm_temp', username: 'suheqi', passwordHash: await auth.hashPassword('Temp-pass-123'), role: 'ADMIN', status: 'ACTIVE', mustChangePassword: true, isSystemAccount: false } as unknown as AdminUser))
  await admins.save(admins.create({ id: 'adm_disabled', username: 'disabled', passwordHash: await auth.hashPassword('Disabled-pass-123'), role: 'ADMIN', status: 'DISABLED', mustChangePassword: false, isSystemAccount: false } as unknown as AdminUser))

  assert.equal((await auth.authenticate('suheqi', 'Temp-pass-123')).id, temp.id)
  await assert.rejects(() => auth.authenticate('disabled', 'Disabled-pass-123'), /账号已停用/)
  const temporaryToken = tokens.issueToken(temp)
  await assert.rejects(() => guard.canActivate(context(temporaryToken, '/admin/activity')), /请先修改初始密码/)
  assert.equal(await guard.canActivate(context(temporaryToken, '/admin/auth/password/initial')), true)
  await assert.rejects(() => auth.changeInitialPassword(temp, 'Temp-pass-123', 'Temp-pass-123'), /不能与当前密码相同/)
  const changed = await auth.changeInitialPassword(temp, 'New-pass-456', 'New-pass-456')
  assert.equal(changed.mustChangePassword, false)
  await assert.rejects(() => auth.authenticate('suheqi', 'Temp-pass-123'), /账号或密码错误/)
  assert.equal((await auth.authenticate('suheqi', 'New-pass-456')).id, temp.id)
  await assert.rejects(() => auth.changeOwnPassword(changed, 'incorrect', 'Daily-pass-789', 'Daily-pass-789'), /当前密码错误/)
  await auth.changeOwnPassword(changed, 'New-pass-456', 'Daily-pass-789', 'Daily-pass-789')
  assert.equal((await auth.authenticate('suheqi', 'Daily-pass-789')).id, temp.id)
  const visible = await auth.listVisibleAdmins()
  assert(!visible.some((admin) => admin.id === system.id), 'system admin leaked into visible list')
  assert(tokens.verifyToken(tokens.issueToken(system)).adminId === system.id, 'token does not bind admin ID')
  assert((await db.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'admin_user' ")).length === 1, 'admin_user migration missing')
  console.log('V3.0 admin auth smoke PASS')
  await app.close()
  cleanup()
}

main().then(() => process.exit(0)).catch((error) => { console.error(error?.message || error); cleanup(); process.exit(1) })
