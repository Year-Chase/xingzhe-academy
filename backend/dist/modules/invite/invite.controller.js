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
exports.InviteController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const invite_service_1 = require("./invite.service");
let InviteController = class InviteController {
    constructor(inviteService) {
        this.inviteService = inviteService;
    }
    async me(userId) {
        const data = await this.inviteService.getMyInvite(userId);
        return { code: 0, message: 'success', data };
    }
    async validate(inviteCode) {
        if (!inviteCode)
            return { code: 10001, message: '缺少 inviteCode', data: null };
        const valid = await this.inviteService.validateCode(inviteCode);
        return { code: 0, message: valid ? '有效' : '无效', data: { valid } };
    }
    async bind(userId, inviteCode) {
        try {
            const result = await this.inviteService.bindInviteCode(userId, inviteCode);
            return { code: 0, message: 'success', data: result };
        }
        catch (e) {
            return { code: 10003, message: e.message, data: null };
        }
    }
    async list(userId) {
        const data = await this.inviteService.getInviteList(userId);
        return { code: 0, message: 'success', data };
    }
};
exports.InviteController = InviteController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InviteController.prototype, "me", null);
__decorate([
    (0, common_1.Post)('validate'),
    __param(0, (0, common_1.Body)('inviteCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InviteController.prototype, "validate", null);
__decorate([
    (0, common_1.Post)('bind'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)('inviteCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InviteController.prototype, "bind", null);
__decorate([
    (0, common_1.Get)('list'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InviteController.prototype, "list", null);
exports.InviteController = InviteController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('invite'),
    __metadata("design:paramtypes", [invite_service_1.InviteService])
], InviteController);
//# sourceMappingURL=invite.controller.js.map