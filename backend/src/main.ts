import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'
import { mkdirSync } from 'fs'
import { join } from 'path'

async function bootstrap() {
  mkdirSync(join(__dirname, '..', 'data'), { recursive: true })
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.enableCors()
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' })
  await app.listen(3000, '0.0.0.0')
  console.log('行者 V3 Backend running on http://localhost:3000')
}
bootstrap()
