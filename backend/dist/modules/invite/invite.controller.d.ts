import { InviteService } from './invite.service';
export declare class InviteController {
    private readonly inviteService;
    constructor(inviteService: InviteService);
    me(userId: string): Promise<{
        code: number;
        message: string;
        data: {
            inviteCode: string;
            invitedBy: string | null;
            inviteCount: number;
        };
    }>;
    validate(inviteCode: string): Promise<{
        code: number;
        message: string;
        data: null;
    } | {
        code: number;
        message: string;
        data: {
            valid: boolean;
        };
    }>;
    bind(userId: string, inviteCode: string): Promise<{
        code: number;
        message: string;
        data: {
            success: boolean;
        };
    } | {
        code: number;
        message: any;
        data: null;
    }>;
    list(userId: string): Promise<{
        code: number;
        message: string;
        data: {
            id: string;
            inviteCode: string;
            invitee: {
                userId: string;
                nickName: string;
            };
            createdAt: Date;
        }[];
    }>;
}
