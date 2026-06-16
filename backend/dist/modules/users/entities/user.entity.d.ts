export declare class User {
    id: string;
    openid: string;
    unionid?: string;
    nickName: string;
    avatarUrl: string;
    phone?: string;
    gender: number;
    status: number;
    pointsBalance: number;
    totalDiaryDays: number;
    inviteCode?: string;
    invitedByUserId?: string;
    role: string;
    isWhitelist: number;
    createdAt: Date;
    updatedAt: Date;
}
