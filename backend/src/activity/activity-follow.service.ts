import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { EntityManager, IsNull, Not, Repository } from 'typeorm'
import { Activity } from './entities/activity.entity'
import { ActivityFollow } from './entities/activity-follow.entity'

export type ActivityFollowStats = {
  currentFollowers: number
  totalFollowers: number
  convertedFollowers: number
  conversionRate: number
}

@Injectable()
export class ActivityFollowService {
  constructor(
    @InjectRepository(ActivityFollow)
    private readonly followRepo: Repository<ActivityFollow>,
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
  ) {}

  async follow(userId: string, activityId: number) {
    await this.assertActivity(activityId)
    const existing = await this.followRepo.findOne({ where: { userId, activityId } })
    if (existing?.unfollowedAt === null) return { isFollowed: true, followedAt: existing.followedAt }

    const now = new Date()
    if (existing) {
      existing.followedAt = now
      existing.unfollowedAt = null
      await this.followRepo.save(existing)
    } else {
      await this.followRepo.save(this.followRepo.create({ userId, activityId, followedAt: now, unfollowedAt: null, convertedAt: null }))
    }
    return { isFollowed: true, followedAt: now }
  }

  async unfollow(userId: string, activityId: number) {
    const existing = await this.followRepo.findOne({ where: { userId, activityId } })
    if (!existing || existing.unfollowedAt !== null) return { isFollowed: false }
    existing.unfollowedAt = new Date()
    await this.followRepo.save(existing)
    return { isFollowed: false }
  }

  async isFollowed(userId: string, activityId: number) {
    return !!(await this.followRepo.findOne({ where: { userId, activityId, unfollowedAt: IsNull() } }))
  }

  async markConverted(manager: EntityManager, userId: string, activityId: number, registeredAt: Date) {
    const repo = manager.getRepository(ActivityFollow)
    const follow = await repo.findOne({ where: { userId, activityId, unfollowedAt: IsNull() } })
    if (!follow || follow.convertedAt || follow.followedAt >= registeredAt) return
    follow.convertedAt = registeredAt
    await repo.save(follow)
  }

  async getStats(activityId: number): Promise<ActivityFollowStats> {
    const [currentFollowers, totalFollowers, convertedFollowers] = await Promise.all([
      this.followRepo.count({ where: { activityId, unfollowedAt: IsNull() } }),
      this.followRepo.count({ where: { activityId } }),
      this.followRepo.count({ where: { activityId, convertedAt: Not(IsNull()) } }),
    ])
    return {
      currentFollowers,
      totalFollowers,
      convertedFollowers,
      conversionRate: totalFollowers > 0 ? Number((convertedFollowers / totalFollowers).toFixed(4)) : 0,
    }
  }

  async getFollowedActivities(userId: string, page: number, limit: number, seriesIds: string[] = []) {
    const qb = this.activityRepo.createQueryBuilder('activity')
      .innerJoin(ActivityFollow, 'follow', 'follow.activityId = activity.id AND follow.userId = :userId AND follow.unfollowedAt IS NULL', { userId })
      .leftJoinAndSelect('activity.category', 'category')
      .leftJoinAndSelect('activity.series', 'series')
      .where('activity.status = :status', { status: 'PUBLISHED' })
      .orderBy('activity.createdAt', 'DESC')
    if (seriesIds.length) qb.andWhere('activity.seriesId IN (:...seriesIds)', { seriesIds })
    qb.skip((page - 1) * limit).take(limit)
    const [items, total] = await qb.getManyAndCount()
    return { items, total }
  }

  private async assertActivity(activityId: number) {
    const activity = await this.activityRepo.findOne({ where: { id: activityId } })
    if (!activity) throw new NotFoundException(`Activity ${activityId} not found`)
  }
}
