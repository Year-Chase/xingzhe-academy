import { SpeechService } from './speech.service';
declare class CreateTaskDto {
    audioUrl: string;
}
export declare class SpeechController {
    private readonly speechService;
    constructor(speechService: SpeechService);
    create(dto: CreateTaskDto): Promise<{
        code: number;
        message: string;
        data: {
            taskId: number;
        };
    } | {
        code: number;
        message: any;
        data: null;
    }>;
    queryStatus(taskId: number): Promise<{
        code: number;
        message: string;
        data: {
            status: number;
            text: string;
        };
    } | {
        code: number;
        message: any;
        data: null;
    }>;
}
export {};
