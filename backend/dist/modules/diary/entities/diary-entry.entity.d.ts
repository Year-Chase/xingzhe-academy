import { User } from '../../users/entities/user.entity';
export declare class DiaryEntry {
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
}
