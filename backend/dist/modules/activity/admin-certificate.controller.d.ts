import { Repository } from 'typeorm';
import { ActivityCertificate } from './entities/activity-certificate.entity';
import { ActivityRegistration } from './entities/activity-registration.entity';
import { Activity } from './entities/activity.entity';
export declare class AdminCertificateController {
    private readonly certRepo;
    private readonly regRepo;
    private readonly actRepo;
    constructor(certRepo: Repository<ActivityCertificate>, regRepo: Repository<ActivityRegistration>, actRepo: Repository<Activity>);
    list(activityId?: string, status?: string): Promise<{
        code: number;
        message: string;
        data: ActivityCertificate[];
    }>;
    generate(activityId: string, userId: string): Promise<{
        code: number;
        message: string;
        data: null;
    } | {
        code: number;
        message: string;
        data: ActivityCertificate;
    }>;
    updateStatus(id: string, status: string): Promise<{
        code: number;
        message: string;
        data: ActivityCertificate | null;
    }>;
}
