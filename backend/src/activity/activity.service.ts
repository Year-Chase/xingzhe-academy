import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Activity } from './entities/activity.entity'

@Injectable()
export class ActivityService implements OnModuleInit {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
  ) {}

  async onModuleInit() {
    const count = await this.activityRepo.count()
    if (count > 0) return

    const now = new Date()
    await this.activityRepo.save([
      {
        title: '🏃 奥森晨跑',
        description: '每周六早上7点在奥森南门集合，沿5km环线慢跑。适合所有水平的跑者，新手友好。请穿运动鞋，自带饮用水。',
        location: '奥林匹克森林公园南门',
        startTime: new Date(now.getTime() + 86400000),
        endTime: new Date(now.getTime() + 86400000 + 7200000),
        capacity: 30,
        status: 'active',
      },
      {
        title: '🚴 周末骑行',
        description: '沿温榆河绿道骑行30km，途经多个湿地公园。需自备自行车（或扫码共享单车），头盔必备。',
        location: '温榆河绿道入口',
        startTime: new Date(now.getTime() + 172800000),
        endTime: new Date(now.getTime() + 172800000 + 14400000),
        capacity: 20,
        status: 'active',
      },
      {
        title: '🧘 朝阳公园瑜伽',
        description: '在草坪上进行1小时流瑜伽，由持证教练带领。请自带瑜伽垫，建议穿宽松舒适衣物。',
        location: '朝阳公园中心草坪',
        startTime: new Date(now.getTime() + 259200000),
        endTime: new Date(now.getTime() + 259200000 + 3600000),
        capacity: 25,
        status: 'active',
      },
      {
        title: '⛰️ 香山徒步',
        description: '从香山邮局出发，经好汉坡登顶，全程约8km，累计爬升500m。有一定强度，要求参与者体能良好。',
        location: '香山邮局',
        startTime: new Date(now.getTime() + 604800000),
        endTime: new Date(now.getTime() + 604800000 + 21600000),
        capacity: 15,
        status: 'active',
      },
      {
        title: '🏊 游泳训练',
        description: '在英东游泳馆进行1.5小时游泳训练，含技术指导和自由泳练习。需自带泳衣、泳帽、泳镜。',
        location: '英东游泳馆',
        startTime: new Date(now.getTime() + 345600000),
        endTime: new Date(now.getTime() + 345600000 + 5400000),
        capacity: 12,
        status: 'active',
      },
    ])
    console.log('[ActivityService] Seeded 5 activities')
  }

  async getList(): Promise<Activity[]> {
    return this.activityRepo.find({ where: { status: 'active' }, order: { startTime: 'ASC' } })
  }

  async getDetail(id: number): Promise<Activity> {
    const a = await this.activityRepo.findOne({ where: { id } })
    if (!a) throw new NotFoundException(`Activity ${id} not found`)
    return a
  }
}
