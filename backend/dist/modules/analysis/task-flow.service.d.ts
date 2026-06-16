import { Repository } from 'typeorm';
import { SupplementarySession } from './entities/supplementary-session.entity';
import { StateAnalysis } from './entities/state-analysis.entity';
export declare class TaskFlowService {
    private readonly sessionRepo;
    private readonly analysisRepo;
    constructor(sessionRepo: Repository<SupplementarySession>, analysisRepo: Repository<StateAnalysis>);
    prepareSession(params: {
        userId: string;
        content: string;
        stateCode: string;
        scoreStress: number;
        scoreEmotion: number;
        currentStreak: number;
    }): Promise<{
        sessionId: string;
        tasks: import("../../config/task-definitions").TaskDefinition[];
    }>;
    completeSession(params: {
        sessionId: string;
        userId: string;
        answers: Array<{
            taskCode: string;
            value: any;
        }>;
    }): Promise<{
        sessionId: string;
        status: string;
        stateOut: null;
        scoresOut: null;
    }>;
}
