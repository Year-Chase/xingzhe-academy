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
exports.CertificateController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const activity_certificate_entity_1 = require("./entities/activity-certificate.entity");
const activity_entity_1 = require("./entities/activity.entity");
const checkin_entity_1 = require("./entities/checkin.entity");
const user_entity_1 = require("../users/entities/user.entity");
let CertificateController = class CertificateController {
    constructor(certRepo, actRepo, checkinRepo, userRepo) {
        this.certRepo = certRepo;
        this.actRepo = actRepo;
        this.checkinRepo = checkinRepo;
        this.userRepo = userRepo;
    }
    async myList(userId) {
        const certs = await this.certRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
        if (certs.length === 0)
            return { code: 0, message: 'success', data: [] };
        const ids = [...new Set(certs.map(c => c.activityId))];
        const activities = await this.actRepo.findByIds(ids);
        const map = new Map(activities.map(a => [a.id, a]));
        return { code: 0, message: 'success', data: certs.map(c => ({ ...c, activity: map.get(c.activityId) || null })) };
    }
    async companionsEarly(id, userId) {
        const cert = await this.certRepo.findOne({ where: { id, userId } });
        if (!cert)
            return { code: 10002, message: '证书不存在', data: null };
        const activityCheckins = await this.checkinRepo.find({
            where: { activityId: cert.activityId },
        });
        const companionIds = activityCheckins
            .map(c => c.userId)
            .filter(uid => uid !== userId);
        if (companionIds.length === 0)
            return { code: 0, message: 'success', data: [] };
        const sharedCounts = {};
        for (const cid of companionIds) {
            const allCk = await this.checkinRepo.find({ where: { userId: cid } });
            const common = allCk.filter(c => activityCheckins.some(ac => ac.activityId === c.activityId));
            sharedCounts[cid] = common.length;
        }
        const users = await this.userRepo.findByIds(companionIds);
        const userMap = new Map(users.map(u => [u.id, u]));
        const result = companionIds
            .map(uid => ({
            userId: uid,
            nickName: userMap.get(uid)?.nickName || '—',
            sharedCount: sharedCounts[uid] || 1,
        }))
            .sort((a, b) => b.sharedCount - a.sharedCount)
            .slice(0, 10);
        return { code: 0, message: 'success', data: result };
    }
    async detail(id, userId) {
        const cert = await this.certRepo.findOne({ where: { id, userId } });
        if (!cert)
            return { code: 10002, message: '证书不存在', data: null };
        return { code: 0, message: 'success', data: cert };
    }
};
exports.CertificateController = CertificateController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('my'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CertificateController.prototype, "myList", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':id/companions'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CertificateController.prototype, "companionsEarly", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CertificateController.prototype, "detail", null);
exports.CertificateController = CertificateController = __decorate([
    (0, common_1.Controller)('certificates'),
    __param(0, (0, typeorm_1.InjectRepository)(activity_certificate_entity_1.ActivityCertificate)),
    __param(1, (0, typeorm_1.InjectRepository)(activity_entity_1.Activity)),
    __param(2, (0, typeorm_1.InjectRepository)(checkin_entity_1.Checkin)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CertificateController);
//# sourceMappingURL=certificate.controller.js.map