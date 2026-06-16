import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
export declare class UsersService {
    private readonly userRepo;
    constructor(userRepo: Repository<User>);
    getProfile(userId: string): Promise<{
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
    }>;
}
