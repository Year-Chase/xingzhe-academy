import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { InviteRecord } from './entities/invite-record.entity';
export declare class AdminInviteController {
    private readonly inviteRepo;
    private readonly userRepo;
    constructor(inviteRepo: Repository<InviteRecord>, userRepo: Repository<User>);
    list(): Promise<{
        code: number;
        message: string;
        data: {
            id: string;
            inviteCode: string;
            inviter: string;
            inviterId: string;
            invitee: string;
            inviteeId: string;
            createdAt: Date;
        }[];
    }>;
}
