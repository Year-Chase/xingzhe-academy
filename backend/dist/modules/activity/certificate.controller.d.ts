import { Repository } from 'typeorm';
import { ActivityCertificate } from './entities/activity-certificate.entity';
import { Activity } from './entities/activity.entity';
import { Checkin } from './entities/checkin.entity';
import { User } from '../users/entities/user.entity';
export declare class CertificateController {
    private readonly certRepo;
    private readonly actRepo;
    private readonly checkinRepo;
    private readonly userRepo;
    constructor(certRepo: Repository<ActivityCertificate>, actRepo: Repository<Activity>, checkinRepo: Repository<Checkin>, userRepo: Repository<User>);
    myList(userId: string): Promise<{
        code: number;
        message: string;
        data: {
            activity: Activity | null;
            id: string;
            userId: string;
            activityId: string;
            certificateNo: string;
            certificateUrl?: string;
            status: string;
            certificateType: string;
            downloadCount: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
    companionsEarly(id: string, userId: string): Promise<{
        code: number;
        message: string;
        data: null;
    } | {
        code: number;
        message: string;
        data: {
            userId: string;
            nickName: string;
            sharedCount: number;
        }[];
    }>;
    detail(id: string, userId: string): Promise<{
        code: number;
        message: string;
        data: null;
    } | {
        code: number;
        message: string;
        data: ActivityCertificate;
    }>;
}
