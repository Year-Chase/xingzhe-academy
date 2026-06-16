import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { InviteRecord } from './entities/invite-record.entity';
export declare class InviteService {
    private readonly userRepo;
    private readonly inviteRepo;
    constructor(userRepo: Repository<User>, inviteRepo: Repository<InviteRecord>);
    getMyInvite(userId: string): Promise<{
        inviteCode: string;
        invitedBy: string | null;
        inviteCount: number;
    }>;
    validateCode(code: string): Promise<boolean>;
    getInviteList(userId: string): Promise<{
        id: string;
        inviteCode: string;
        invitee: {
            userId: string;
            nickName: string;
        };
        createdAt: Date;
    }[]>;
    bindInviteCode(userId: string, code: string): Promise<{
        success: boolean;
    }>;
}
