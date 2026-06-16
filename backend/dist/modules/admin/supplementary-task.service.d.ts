import { Repository } from 'typeorm';
import { SupplementaryTask } from './entities/supplementary-task.entity';
export declare class SupplementaryTaskService {
    private readonly repo;
    constructor(repo: Repository<SupplementaryTask>);
    list(): Promise<SupplementaryTask[]>;
    create(dto: {
        taskCode: string;
        title: string;
        type: string;
        targetVariable?: string;
        options?: any;
        triggerRules?: any;
        required?: boolean;
        sortOrder?: number;
        weight?: number;
    }): Promise<SupplementaryTask>;
    update(taskCode: string, dto: Partial<{
        title: string;
        type: string;
        targetVariable: string;
        options: any;
        triggerRules: any;
        required: boolean;
        sortOrder: number;
        weight: number;
        status: string;
    }>): Promise<SupplementaryTask | null>;
    archive(taskCode: string): Promise<{
        taskCode: string;
        status: string;
    }>;
    getEnabled(): Promise<SupplementaryTask[]>;
}
