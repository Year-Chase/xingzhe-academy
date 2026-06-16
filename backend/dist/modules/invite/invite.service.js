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
exports.InviteService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const user_entity_1 = require("../users/entities/user.entity");
const invite_record_entity_1 = require("./entities/invite-record.entity");
let InviteService = class InviteService {
    constructor(userRepo, inviteRepo) {
        this.userRepo = userRepo;
        this.inviteRepo = inviteRepo;
    }
    async getMyInvite(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        const inviteCount = await this.inviteRepo.count({ where: { inviterUserId: userId } });
        const inviter = user?.invitedByUserId
            ? await this.userRepo.findOne({ where: { id: user.invitedByUserId } })
            : null;
        return {
            inviteCode: user?.inviteCode || '',
            invitedBy: inviter?.nickName || null,
            inviteCount,
        };
    }
    async validateCode(code) {
        const user = await this.userRepo.findOne({ where: { inviteCode: code } });
        return !!user;
    }
    async getInviteList(userId) {
        const records = await this.inviteRepo.find({ where: { inviterUserId: userId }, order: { createdAt: 'DESC' } });
        if (records.length === 0)
            return [];
        const inviteeIds = [...new Set(records.map(r => r.inviteeUserId))];
        const users = await this.userRepo.findByIds(inviteeIds);
        const userMap = new Map(users.map(u => [u.id, u]));
        return records.map(r => ({
            id: r.id,
            inviteCode: r.inviteCode,
            invitee: {
                userId: r.inviteeUserId,
                nickName: userMap.get(r.inviteeUserId)?.nickName || '',
            },
            createdAt: r.createdAt,
        }));
    }
    async bindInviteCode(userId, code) {
        const me = await this.userRepo.findOne({ where: { id: userId } });
        if (!me)
            throw new Error('用户不存在');
        if (me.inviteCode === code)
            throw new Error('SELF_BINDING: 不能绑定自己的邀请码');
        if (me.invitedByUserId)
            throw new Error('ALREADY_BOUND: 您已经绑定过邀请人');
        const inviter = await this.userRepo.findOne({ where: { inviteCode: code } });
        if (!inviter)
            throw new Error('INVALID_CODE: 该邀请码不存在');
        await this.userRepo.update(userId, { invitedByUserId: inviter.id });
        const record = new invite_record_entity_1.InviteRecord();
        record.id = (0, uuid_1.v4)();
        record.inviterUserId = inviter.id;
        record.inviteeUserId = userId;
        record.inviteCode = code;
        await this.inviteRepo.save(record);
        return { success: true };
    }
};
exports.InviteService = InviteService;
exports.InviteService = InviteService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(invite_record_entity_1.InviteRecord)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], InviteService);
//# sourceMappingURL=invite.service.js.map