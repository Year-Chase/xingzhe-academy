import { ConfigService } from '@nestjs/config';
export declare class SpeechService {
    private readonly config;
    private asrClient;
    private configured;
    constructor(config: ConfigService);
    createTask(audioUrl: string): Promise<{
        taskId: number;
    }>;
    queryTask(taskId: number): Promise<{
        status: number;
        text: string;
        errorMsg: string;
    }>;
}
