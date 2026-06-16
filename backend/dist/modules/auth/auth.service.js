"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const user_entity_1 = require("../users/entities/user.entity");
const invite_record_entity_1 = require("../invite/entities/invite-record.entity");
let AuthService = class AuthService {
    constructor(jwtService, userRepo, inviteRepo) {
        this.jwtService = jwtService;
        this.userRepo = userRepo;
        this.inviteRepo = inviteRepo;
    }
    async mockLogin(code, nickname, shareInviterId, manualInviteCode) {
        const loginCode = code || 'auto_login';
        const mockOpenId = `mock_openid_${loginCode.slice(0, 8)}`;
        let user = await this.userRepo.findOne({ where: { openid: mockOpenId } });
        if (!user) {
            const myCode = 'TG' + Math.random().toString(36).slice(2, 8).toUpperCase();
            const displayName = nickname || `行者${mockOpenId.slice(-4)}`;
            user = this.userRepo.create({
                id: (0, uuid_1.v4)(), openid: mockOpenId,
                nickName: displayName,
                inviteCode: myCode, status: 1,
            });
            await this.userRepo.save(user);
        }
        else if (nickname && user.nickName !== nickname) {
            await this.userRepo.update(user.id, { nickName: nickname });
            user.nickName = nickname;
        }
        let bound = false;
        let bindMsg = null;
        const tryBind = async (inviterIdentifier) => {
            if (!user || user.invitedByUserId)
                return;
            let inviter = await this.userRepo.findOne({ where: { inviteCode: inviterIdentifier } });
            if (!inviter)
                inviter = await this.userRepo.findOne({ where: { id: inviterIdentifier } });
            if (!inviter || inviter.id === user.id)
                return;
            await this.userRepo.update(user.id, { invitedByUserId: inviter.id });
            const rec = new invite_record_entity_1.InviteRecord();
            rec.id = (0, uuid_1.v4)();
            rec.inviterUserId = inviter.id;
            rec.inviteeUserId = user.id;
            rec.inviteCode = inviter.inviteCode || '';
            await this.inviteRepo.save(rec);
            bound = true;
        };
        if (shareInviterId) {
            try {
                await tryBind(shareInviterId);
            }
            catch { }
        }
        if (!bound && manualInviteCode) {
            try {
                await tryBind(manualInviteCode);
            }
            catch {
                bindMsg = '邀请码无效';
            }
        }
        const token = this.jwtService.sign({
            sub: user.id, iat: Math.floor(Date.now() / 1000),
        });
        return {
            token, bindMsg,
            user: {
                userId: user.id, nickName: user.nickName, avatarUrl: user.avatarUrl,
                inviteCode: user.inviteCode, invitedByUserId: user.invitedByUserId,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(invite_record_entity_1.InviteRecord)),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map