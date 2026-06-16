import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { ActivityRegistration } from './entities/activity-registration.entity';
import { ActivityOrder } from './entities/activity-order.entity';
export declare class OrderController {
    private readonly actRepo;
    private readonly regRepo;
    private readonly orderRepo;
    constructor(actRepo: Repository<Activity>, regRepo: Repository<ActivityRegistration>, orderRepo: Repository<ActivityOrder>);
    create(userId: string, activityId: string): Promise<{
        code: number;
        message: string;
        data: null;
    } | {
        code: number;
        message: string;
        data: {
            id: string;
            orderNo: string;
            amount: number;
            status: string;
        };
    }>;
    mockPay(userId: string, orderId: string): Promise<{
        code: number;
        message: string;
        data: null;
    } | {
        code: number;
        message: string;
        data: {
            orderNo: string;
            status: string;
            registrationId: string;
        };
    }>;
    myOrders(userId: string): Promise<{
        code: number;
        message: string;
        data: {
            activity: Activity | null;
            id: string;
            orderNo: string;
            userId: string;
            activityId: string;
            amount: number;
            status: string;
            payTime?: Date;
            refundTime?: Date;
            createdAt: Date;
            updatedAt: Date;
        }[];
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
