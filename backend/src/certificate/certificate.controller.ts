import { Controller, Get, Post, Patch, Param, Body, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname } from 'path'
import { ensureUploadSubDir, toPublicUploadUrl } from '../config/upload-path'
import { CertificateService } from './certificate.service'

@Controller('admin/certificate-templates')
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
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
        cb(new BadRequestException('Only jpg/jpeg/png/webp allowed'), false)
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
