import { SupplementaryTaskService } from './supplementary-task.service';
export declare class SupplementaryTaskController {
    private readonly service;
    constructor(service: SupplementaryTaskService);
    list(): Promise<{
        code: number;
        message: string;
        data: import("./entities/supplementary-task.entity").SupplementaryTask[];
    }>;
    create(dto: any): Promise<{
        code: number;
        message: string;
        data: import("./entities/supplementary-task.entity").SupplementaryTask;
    }>;
    update(taskCode: string, dto: any): Promise<{
        code: number;
        message: string;
        data: import("./entities/supplementary-task.entity").SupplementaryTask | null;
    }>;
    archive(taskCode: string): Promise<{
        code: number;
        message: string;
        data: {
            taskCode: string;
            status: string;
        };
    }>;
}
