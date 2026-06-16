import { DiaryService } from './diary.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
export declare class DiaryController {
    private readonly diaryService;
    constructor(diaryService: DiaryService);
    uploadAudio(file: Express.Multer.File): Promise<{
        code: number;
        message: string;
        data: null;
    } | {
        code: number;
        message: string;
        data: {
            audioUrl: string;
            fileSize: number;
            originalName: string;
        };
    }>;
    create(userId: string, dto: CreateDiaryDto): Promise<{
        code: number;
        message: string;
        data: {
            id: string;
            content: string;
            contentType: string;
            audioUrl: string | undefined;
            audioDuration: number | undefined;
            moodTag: string | undefined;
            diaryDate: Date;
            createdAt: Date;
        };
    }>;
    list(userId: string, page?: number, pageSize?: number): Promise<{
        code: number;
        message: string;
        data: {
            list: {
                id: any;
                content: any;
                contentType: any;
                hasVoice: boolean;
                diaryDate: any;
                createdAt: any;
                analysis: {
                    stateCode: any;
                    stateLabel: any;
                    summary: any;
                    tensionScore: number;
                } | null;
            }[];
            pagination: {
                page: number;
                pageSize: number;
                total: number;
                totalPages: number;
            };
        };
    }>;
    detail(id: string): Promise<{
        code: number;
        message: string;
        data: null;
    } | {
        code: number;
        message: string;
        data: {
            id: any;
            content: any;
            contentType: any;
            audioUrl: any;
            hasVoice: boolean;
            diaryDate: any;
            createdAt: any;
            analysis: {
                id: any;
                tensionScore: number;
                emotion: string;
                recoveryLevel: string;
                durationLevel: string;
                stateCode: any;
                stateLabel: any;
                summary: any;
                evidence: any;
                suggestion: any;
                confidence: any;
                createdAt: any;
            } | null;
        };
    }>;
    private formatDiaryListItem;
    private formatDiaryDetail;
    private valenceToEmotion;
    private numToRecovery;
    private numToDuration;
}
