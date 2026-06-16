import { Repository } from 'typeorm';
import { InterventionRecord } from './entities/intervention-record.entity';
export declare class InterventionController {
    private readonly repo;
    constructor(repo: Repository<InterventionRecord>);
    record(userId: string, dto: {
        type: string;
        durationSeconds: number;
        completed: boolean;
    }): Promise<{
        code: number;
        message: string;
        data: {
            id: string;
        };
    }>;
    history(userId: string): Promise<{
        code: number;
        message: string;
        data: InterventionRecord[];
    }>;
}
