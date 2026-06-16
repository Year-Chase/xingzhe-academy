import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { ActivityRegistration } from './entities/activity-registration.entity';
import { ActivityShareLog } from './entities/activity-share-log.entity';
export declare class ActivityController {
    private readonly repo;
    private readonly regRepo;
    private readonly shareLogRepo;
    constructor(repo: Repository<Activity>, regRepo: Repository<ActivityRegistration>, shareLogRepo: Repository<ActivityShareLog>);
    list(status?: string): Promise<{
        code: number;
        message: string;
        data: Activity[];
    }>;
    myActivities(userId: string): Promise<{
        code: number;
        message: string;
        data: {
            activity: Activity | null;
            id: string;
            activityId: string;
            userId: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
    detail(id: string, userId: string): Promise<{
        code: number;
        message: string;
        data: null;
    } | {
        code: number;
        message: string;
        data: {
            registeredCount: number;
            isRegistered: boolean;
            registrationStatus: string | null;
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
        };
    }>;
    logShare(id: string, userId: string, dto: {
        channel?: string;
    }): Promise<{
        code: number;
        message: string;
        data: {
            id: string;
        };
    }>;
    register(id: string, userId: string): Promise<{
        code: number;
        message: string;
        data: null;
    } | {
        code: number;
        message: string;
        data: {
            requiresPayment: boolean;
            amount: number;
            id?: undefined;
            status?: undefined;
        };
    } | {
        code: number;
        message: string;
        data: {
            id: string;
            status: string;
            requiresPayment?: undefined;
            amount?: undefined;
        };
    }>;
    cancel(id: string, userId: string): Promise<{
        code: number;
        message: string;
        data: null;
    } | {
        code: number;
        message: string;
        data: {
            id: string;
            status: string;
        };
    }>;
}
