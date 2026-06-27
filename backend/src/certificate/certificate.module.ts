import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CertificateController } from './certificate.controller'
import { CertificateService } from './certificate.service'
import { CertificateTemplate } from './entities/certificate-template.entity'

@Module({
  imports: [TypeOrmModule.forFeature([CertificateTemplate])],
  controllers: [CertificateController],
  providers: [CertificateService],
  exports: [TypeOrmModule],
})
export class CertificateModule {}
