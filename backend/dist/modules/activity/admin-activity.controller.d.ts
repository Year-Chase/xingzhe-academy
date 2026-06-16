import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { ActivityRegistration } from './entities/activity-registration.entity';
import { ActivityShareLog } from './entities/activity-share-log.entity';
export declare class AdminActivityController {
    private readonly repo;
    private readonly regRepo;
    private readonly shareLogRepo;
    constructor(repo: Repository<Activity>, regRepo: Repository<ActivityRegistration>, shareLogRepo: Repository<ActivityShareLog>);
    list(): Promise<{
        code: number;
        message: string;
        data: {
            registeredCount: number;
            shareCount: number;
            id: string;
            title: string;
            cover?: string;
            summary?: string;
            content?: string;
            startTime: Date;
            endTime: Date;
            location?: string;
            organizer?: string;
            price: number;
            capacity?: number;
            status: string;
            photos?: string[];
            speakerId?: string;
            whitelistEnabled: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
    registrations(id: string): Promise<{
        code: number;
        message: string;
        data: ActivityRegistration[];
    }>;
    stats(id: string): Promise<{
        code: number;
        message: string;
        data: {
            registeredCount: number;
            shareCount: number;
        };
    }>;
    create(dto: any): Promise<{
        code: number;
        message: string;
        data: Activity;
    }>;
    update(id: string, dto: any): Promise<{
        code: number;
        message: string;
        data: Activity | null;
    }>;
    cancel(id: string): Promise<{
        code: number;
        message: string;
        data: Activity | null;
    }>;
}
