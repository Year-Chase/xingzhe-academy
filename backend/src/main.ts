import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'
import { getUploadRootDir } from './config/upload-path'
import { getCorsOrigin } from './config/runtime-config'
import { mkdirSync } from 'fs'
import { join } from 'path'

async function bootstrap() {
  mkdirSync(join(__dirname, '..', 'data'), { recursive: true })

  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  // CORS: production fails fast unless CORS_ORIGIN is explicit.
  const corsOrigin = getCorsOrigin()
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  })

  // Static uploads: uses same UPLOAD_DIR as upload controllers
  const uploadDir = getUploadRootDir()
  mkdirSync(uploadDir, { recursive: true })
  app.useStaticAssets(uploadDir, { prefix: '/uploads' })

  const port = parseInt(process.env.PORT || '3000')
  await app.listen(port, '0.0.0.0')
  console.log(`行者 V3 Backend running on http://0.0.0.0:${port}`)
}
bootstrap()
