import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(userId: string): Promise<{
        code: number;
        message: string;
        data: {
            userId: string;
            nickName: string;
            avatarUrl: string;
            phone: string | undefined;
            gender: number;
            inviteCode: string | undefined;
            invitedByUserId: string | undefined;
            pointsBalance: number;
            totalDiaryDays: number;
            createdAt: Date;
        };
    }>;
}
