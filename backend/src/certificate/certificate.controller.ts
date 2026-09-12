import { Controller, Get, Post, Patch, Param, Body, UseInterceptors, UploadedFile, BadRequestException, UseGuards } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname } from 'path'
import { ensureUploadSubDir, toPublicUploadUrl } from '../config/upload-path'
import { CertificateService } from './certificate.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

export const CERTIFICATE_TEMPLATE_MAX_BYTES = 5 * 1024 * 1024
export function validateCertificateTemplateUpload(mimeType: string, size: number) {
  if (!/^image\/(jpeg|png)$/.test(mimeType)) return '仅支持 JPG、JPEG、PNG 图片'
  if (size > CERTIFICATE_TEMPLATE_MAX_BYTES) return '证书底图不能超过 5MB'
  return null
}

@Controller('admin/certificate-templates')
@UseGuards(JwtAuthGuard)
export class CertificateController {
  constructor(private readonly certSvc: CertificateService) {}

  @Get()
  findAll() {
    return this.certSvc.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.certSvc.findOne(id)
  }

  @Post()
  create(@Body() body: any) {
    return this.certSvc.create(body)
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() body: any) {
    return this.certSvc.update(id, body)
  }

  @Post(':id/default')
  setDefault(@Param('id') id: number) {
    return this.certSvc.setDefault(id)
  }

  @Patch(':id/disable')
  disable(@Param('id') id: number) {
    return this.certSvc.delete(id)
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        const dir = ensureUploadSubDir('certificate')
        cb(null, dir)
      },
      filename: (_req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
        cb(null, unique + extname(file.originalname))
      },
    }),
    limits: { fileSize: CERTIFICATE_TEMPLATE_MAX_BYTES },
    fileFilter: (_req, file, cb) => {
      const error = validateCertificateTemplateUpload(file.mimetype, file.size || 0)
      if (error) {
        cb(new BadRequestException(error), false)
      } else {
        cb(null, true)
      }
    },
  }))
  upload(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('No file uploaded')
    return { url: toPublicUploadUrl('certificate', file.filename) }
  }
}
