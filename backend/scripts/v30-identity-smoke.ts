import { randomUUID } from 'crypto'
import { unlinkSync } from 'fs'
import { NestFactory } from '@nestjs/core'
import { DataSource } from 'typeorm'
import { User } from '../src/users/entities/user.entity'
import { UsersService } from '../src/users/users.service'

const dbPath = `/private/tmp/xingzhe-v30-identity-${process.pid}-${randomUUID()}.db`
process.env.SQLITE_DB_PATH = dbPath
process.env.MINIAPP_JWT_SECRET = 'v30-local-miniapp-secret-000000000000'
process.env.ADMIN_TOKEN_SECRET = 'v30-local-admin-secret-000000000000'
process.env.WECHAT_LOGIN_MODE = 'mock'
process.env.WECHAT_APPID = 'miniapp-v30'
const cleanup = () => [dbPath, `${dbPath}-wal`, `${dbPath}-shm`].forEach(path => { try { unlinkSync(path) } catch {} })
const assert = (value: unknown, message: string) => { if (!value) throw new Error(message) }

async function main() {
  cleanup()
  const { AppModule } = await import('../src/app.module')
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false })
  const users = app.get(DataSource).getRepository(User)
  const service = app.get(UsersService)

  const sequential = await Promise.all(Array.from({ length: 10 }, (_, i) => service.wechatLogin({ code: `sequential-${i}` })))
  assert(new Set(sequential.map(result => result.userId)).size === 1, 'sequential login created multiple users')
  assert(await users.count({ where: { wechatAppId: 'miniapp-v30', openid: 'mock_openid_dev' } }) === 1, 'sequential identity row count is not one')

  const concurrent = await Promise.all(Array.from({ length: 10 }, () => service.wechatLogin({ code: 'concurrent-code' })))
  assert(new Set(concurrent.map(result => result.userId)).size === 1, 'concurrent login returned multiple users')
  assert((await users.count()) === 1, 'concurrent login created duplicate users')
  assert(/^usr_[0-9A-Za-z]{12}$/.test(sequential[0].userId), 'short user.id format is invalid')

  process.env.WECHAT_APPID = 'miniapp-v30-other'
  const otherApp = await service.wechatLogin({ code: 'same-openid-different-app' })
  assert(otherApp.userId !== sequential[0].userId && await users.count() === 2, 'different app IDs were merged')
  assert((await users.find()).every(user => /^usr_[0-9A-Za-z]{12}$/.test(user.id)), 'user records were not created with short IDs')

  console.log('V3.0 user identity smoke PASS')
  await app.close(); cleanup()
}
main().then(() => process.exit(0)).catch(error => { console.error(error?.message || error); cleanup(); process.exit(1) })
