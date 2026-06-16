export declare class Activity {
    id: string;
    title: string;
    cover?: string;
    summary?: string;
    content?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    organizer?: string;
    price: number;
    capacity?: number;
    status: string;
    photos?: string[];
    speakerId?: string;
    whitelistEnabled: number;
    createdAt: Date;
    updatedAt: Date;
}
