import { Injectable, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CertificateTemplate } from './entities/certificate-template.entity'

@Injectable()
export class CertificateService {
  constructor(
    @InjectRepository(CertificateTemplate)
    private readonly templateRepo: Repository<CertificateTemplate>,
  ) {}

  findAll(): Promise<CertificateTemplate[]> {
    return this.templateRepo.find({ order: { createdAt: 'DESC' } })
  }

  findOne(id: number): Promise<CertificateTemplate | null> {
    return this.templateRepo.findOne({ where: { id } })
  }

  getDefault(): Promise<CertificateTemplate | null> {
    return this.templateRepo.findOne({ where: { isDefault: true, enabled: true } })
  }

  async create(dto: {
    name: string; description?: string; imageUrl: string
    isDefault?: boolean; enabled?: boolean; fieldConfig?: any
  }) {
    if (!dto.name || !dto.imageUrl) throw new BadRequestException('name and imageUrl are required')
    const t = this.templateRepo.create({
      name: dto.name,
      description: dto.description || '',
      imageUrl: dto.imageUrl,
      isDefault: dto.isDefault || false,
      enabled: dto.enabled !== false,
      fieldConfig: dto.fieldConfig ? JSON.stringify(dto.fieldConfig) : null,
    } as any)
    const saved = await this.templateRepo.save(t) as unknown as CertificateTemplate
    if (dto.isDefault) await this.clearOtherDefaults(saved.id)
    return saved
  }

  async update(id: number, dto: {
    name?: string; description?: string; imageUrl?: string
    isDefault?: boolean; enabled?: boolean; fieldConfig?: any
  }) {
    const t = await this.templateRepo.findOne({ where: { id } })
    if (!t) throw new BadRequestException('Template not found')
    if (dto.name !== undefined) t.name = dto.name
    if (dto.description !== undefined) t.description = dto.description
    if (dto.imageUrl !== undefined) t.imageUrl = dto.imageUrl
    if (dto.isDefault !== undefined) t.isDefault = dto.isDefault
    if (dto.enabled !== undefined) t.enabled = dto.enabled
    if (dto.fieldConfig !== undefined) t.fieldConfig = JSON.stringify(dto.fieldConfig)
    const saved = await this.templateRepo.save(t)
    if (dto.isDefault) await this.clearOtherDefaults(saved.id)
    return saved
  }

  async setDefault(id: number) {
    const t = await this.templateRepo.findOne({ where: { id } })
    if (!t) throw new BadRequestException('Template not found')
    await this.clearOtherDefaults(id)
    t.isDefault = true
    return this.templateRepo.save(t)
  }

  async delete(id: number) {
    const t = await this.templateRepo.findOne({ where: { id } })
    if (!t) throw new BadRequestException('Template not found')
    t.enabled = false
    return this.templateRepo.save(t)
  }

  private async clearOtherDefaults(excludeId: number) {
    await this.templateRepo.update({ isDefault: true }, { isDefault: false })
    // Re-set the one we want
    await this.templateRepo.update({ id: excludeId }, { isDefault: true })
  }
}
