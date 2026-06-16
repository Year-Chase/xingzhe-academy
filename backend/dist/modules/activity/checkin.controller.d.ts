import { Repository } from 'typeorm';
import { CertificateService } from './certificate.service';
import { Checkin } from './entities/checkin.entity';
import { ActivityRegistration } from './entities/activity-registration.entity';
export declare class AdminCheckinController {
    private readonly checkinRepo;
    private readonly regRepo;
    private readonly certificateService;
    constructor(checkinRepo: Repository<Checkin>, regRepo: Repository<ActivityRegistration>, certificateService: CertificateService);
    list(activityId?: string): Promise<{
        code: number;
        message: string;
        data: Checkin[];
    }>;
    byActivity(activityId: string): Promise<{
        code: number;
        message: string;
        data: Checkin[];
    }>;
    manual(dto: {
        activityId: string;
        userId: string;
        verifiedBy?: string;
    }): Promise<{
        code: number;
        message: string;
        data: null;
    } | {
        code: number;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            certificate: {
                id: string;
                type: string;
                certificateNo: string;
                note: string;
            } | {
                id: string;
                type: string;
                certificateNo: string;
                note?: undefined;
            };
        };
    }>;
    scan(dto: {
        code: string;
        activityId: string;
        verifiedBy?: string;
    }): Promise<{
        code: number;
        message: string;
        data: null;
    } | {
        code: number;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            certificate: {
                id: string;
                type: string;
                certificateNo: string;
                note: string;
            } | {
                id: string;
                type: string;
                certificateNo: string;
                note?: undefined;
            };
        };
    }>;
}
