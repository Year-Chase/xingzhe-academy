import { Repository } from 'typeorm';
import { ActivityCertificate } from './entities/activity-certificate.entity';
import { ActivityRegistration } from './entities/activity-registration.entity';
import { Checkin } from './entities/checkin.entity';
import { Activity } from './entities/activity.entity';
export declare class FootprintController {
    private readonly certRepo;
    private readonly regRepo;
    private readonly checkinRepo;
    private readonly actRepo;
    constructor(certRepo: Repository<ActivityCertificate>, regRepo: Repository<ActivityRegistration>, checkinRepo: Repository<Checkin>, actRepo: Repository<Activity>);
    stats(userId: string): Promise<{
        code: number;
        message: string;
        data: {
            activityCount: number;
            cityCount: number;
            companionCount: number;
            speakerCount: number;
        };
    }>;
}
