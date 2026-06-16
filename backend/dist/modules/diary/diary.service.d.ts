import { Repository } from 'typeorm';
import { DiaryEntry } from './entities/diary-entry.entity';
import { User } from '../users/entities/user.entity';
export declare class DiaryService {
    private readonly diaryRepo;
    private readonly userRepo;
    constructor(diaryRepo: Repository<DiaryEntry>, userRepo: Repository<User>);
    create(userId: string, dto: {
        content: string;
        contentType?: string;
        audioUrl?: string;
        audioDuration?: number;
        transcriptText?: string;
        transcriptStatus?: string;
        moodTag?: string;
        diaryDate?: string;
    }): Promise<DiaryEntry>;
    findByUser(userId: string, page?: number, pageSize?: number): Promise<{
        list: {
            analysis: {} | null;
            id: string;
            userId: string;
            user: User;
            content: string;
            contentType: string;
            audioUrl?: string;
            audioDuration?: number;
            transcriptText?: string;
            transcriptStatus?: string;
            wordCount: number;
            moodTag?: string;
            diaryDate: Date;
            createdAt: Date;
            updatedAt: Date;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    }>;
    findById(id: string): Promise<{
        analysis: any;
        id: string;
        userId: string;
        user: User;
        content: string;
        contentType: string;
        audioUrl?: string;
        audioDuration?: number;
        transcriptText?: string;
        transcriptStatus?: string;
        wordCount: number;
        moodTag?: string;
        diaryDate: Date;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
}
