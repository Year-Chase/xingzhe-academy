import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { InviteRecord } from '../invite/entities/invite-record.entity';
export declare class AuthService {
    private readonly jwtService;
    private readonly userRepo;
    private readonly inviteRepo;
    constructor(jwtService: JwtService, userRepo: Repository<User>, inviteRepo: Repository<InviteRecord>);
    mockLogin(code?: string, nickname?: string, shareInviterId?: string, manualInviteCode?: string): Promise<{
        token: string;
        bindMsg: string | null;
        user: {
            userId: string;
            nickName: string;
            avatarUrl: string;
            inviteCode: string | undefined;
            invitedByUserId: string | undefined;
        };
    }>;
}
