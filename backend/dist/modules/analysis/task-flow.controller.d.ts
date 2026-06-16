import { TaskFlowService } from './task-flow.service';
export declare class TaskFlowController {
    private readonly taskFlowService;
    constructor(taskFlowService: TaskFlowService);
    prepare(userId: string, dto: {
        content: string;
        stateCode?: string;
        scoreStress?: number;
        scoreEmotion?: number;
        currentStreak?: number;
    }): Promise<{
        code: number;
        message: string;
        data: null;
    } | {
        code: number;
        message: string;
        data: {
            sessionId: string;
            tasks: import("../../config/task-definitions").TaskDefinition[];
        };
    }>;
    complete(userId: string, dto: {
        sessionId: string;
        answers: Array<{
            taskCode: string;
            value: any;
        }>;
    }): Promise<{
        code: number;
        message: string;
        data: null;
    } | {
        code: number;
        message: string;
        data: {
            sessionId: string;
            status: string;
            stateOut: null;
            scoresOut: null;
        };
    }>;
}
