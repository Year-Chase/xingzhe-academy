import { Repository } from 'typeorm';
import { ActivityCertificate } from './entities/activity-certificate.entity';
import { Activity } from './entities/activity.entity';
export declare class CertificateService {
    private readonly certRepo;
    private readonly actRepo;
    constructor(certRepo: Repository<ActivityCertificate>, actRepo: Repository<Activity>);
    generateAfterCheckin(activityId: string, userId: string): Promise<{
        id: string;
        type: string;
        certificateNo: string;
        note: string;
    } | {
        id: string;
        type: string;
        certificateNo: string;
        note?: undefined;
    }>;
}
