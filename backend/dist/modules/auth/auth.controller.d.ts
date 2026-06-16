import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';
export declare class AuthController {
    private readonly authService;
    private readonly userRepo;
    constructor(authService: AuthService, userRepo: Repository<User>);
    login(dto: LoginDto): Promise<{
        code: number;
        message: string;
        data: {
            token: string;
            bindMsg: string | null;
            user: {
                userId: string;
                nickName: string;
                avatarUrl: string;
                inviteCode: string | undefined;
                invitedByUserId: string | undefined;
            };
        };
    }>;
    me(userId: string): Promise<{
        code: number;
        message: string;
        data: null;
    } | {
        code: number;
        message: string;
        data: {
            userId: string;
            nickName: string;
            avatarUrl: string;
            inviteCode: string | undefined;
            invitedByUserId: string | undefined;
            createdAt: Date;
        };
    }>;
}
