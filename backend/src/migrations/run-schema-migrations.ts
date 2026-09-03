import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'

if (process.env.NODE_ENV !== 'production') {
  process.env.MINIAPP_JWT_SECRET ||= 'local-migration-only-miniapp-secret-000000'
  process.env.ADMIN_TOKEN_SECRET ||= 'local-migration-only-admin-secret'
}

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  })
  await app.close()
  process.exit(0)
}

run().catch(error => {
  console.error(error.message || error)
  process.exit(1)
})
