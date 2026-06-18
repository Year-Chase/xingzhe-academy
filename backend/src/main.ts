import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { mkdirSync } from 'fs'
import { join } from 'path'

async function bootstrap() {
  mkdirSync(join(__dirname, '..', 'data'), { recursive: true })
  const app = await NestFactory.create(AppModule)
  app.enableCors()
  await app.listen(3000)
  console.log('行者 V3 Backend running on http://localhost:3000')
}
bootstrap()
