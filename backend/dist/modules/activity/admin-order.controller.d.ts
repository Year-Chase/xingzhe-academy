import { Repository } from 'typeorm';
import { ActivityOrder } from './entities/activity-order.entity';
export declare class AdminOrderController {
    private readonly orderRepo;
    constructor(orderRepo: Repository<ActivityOrder>);
    list(): Promise<{
        code: number;
        message: string;
        data: ActivityOrder[];
    }>;
    refund(id: string): Promise<{
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
