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
exports.AdminInviteController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const user_entity_1 = require("../users/entities/user.entity");
const invite_record_entity_1 = require("./entities/invite-record.entity");
let AdminInviteController = class AdminInviteController {
    constructor(inviteRepo, userRepo) {
        this.inviteRepo = inviteRepo;
        this.userRepo = userRepo;
    }
    async list() {
        const records = await this.inviteRepo.find({ order: { createdAt: 'DESC' }, take: 100 });
        if (records.length === 0)
            return { code: 0, message: 'success', data: [] };
        const userIds = new Set();
        records.forEach(r => { userIds.add(r.inviterUserId); userIds.add(r.inviteeUserId); });
        const users = await this.userRepo.findByIds([...userIds]);
        const userMap = new Map(users.map(u => [u.id, u]));
        const data = records.map(r => ({
            id: r.id,
            inviteCode: r.inviteCode,
            inviter: userMap.get(r.inviterUserId)?.nickName || '',
            inviterId: r.inviterUserId,
            invitee: userMap.get(r.inviteeUserId)?.nickName || '',
            inviteeId: r.inviteeUserId,
            createdAt: r.createdAt,
        }));
        return { code: 0, message: 'success', data };
    }
};
exports.AdminInviteController = AdminInviteController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminInviteController.prototype, "list", null);
exports.AdminInviteController = AdminInviteController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('admin/invites'),
    __param(0, (0, typeorm_1.InjectRepository)(invite_record_entity_1.InviteRecord)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AdminInviteController);
//# sourceMappingURL=admin-invite.controller.js.map