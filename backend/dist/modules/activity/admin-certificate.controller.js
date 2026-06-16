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
exports.AdminCertificateController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const activity_certificate_entity_1 = require("./entities/activity-certificate.entity");
const activity_registration_entity_1 = require("./entities/activity-registration.entity");
const activity_entity_1 = require("./entities/activity.entity");
function genCertNo(activityId, userId) {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    return `CERT${date}${userId.slice(0, 6).toUpperCase()}`;
}
let AdminCertificateController = class AdminCertificateController {
    constructor(certRepo, regRepo, actRepo) {
        this.certRepo = certRepo;
        this.regRepo = regRepo;
        this.actRepo = actRepo;
    }
    async list(activityId, status) {
        const where = {};
        if (activityId)
            where.activityId = activityId;
        if (status)
            where.status = status;
        const certs = await this.certRepo.find({ where, order: { createdAt: 'DESC' }, take: 100 });
        return { code: 0, message: 'success', data: certs };
    }
    async generate(activityId, userId) {
        const activity = await this.actRepo.findOne({ where: { id: activityId } });
        if (!activity)
            return { code: 10002, message: '活动不存在', data: null };
        const reg = await this.regRepo.findOne({ where: { activityId, userId, status: 'REGISTERED' } });
        if (!reg)
            return { code: 10003, message: '用户未完成该活动', data: null };
        const existing = await this.certRepo.findOne({ where: { activityId, userId } });
        if (existing)
            return { code: 0, message: '证书已存在', data: existing };
        const cert = new activity_certificate_entity_1.ActivityCertificate();
        cert.id = (0, uuid_1.v4)();
        cert.userId = userId;
        cert.activityId = activityId;
        cert.certificateNo = genCertNo(activityId, userId);
        cert.status = 'GENERATED';
        cert.certificateUrl = `/pages/activity/cert-preview?id=${cert.id}`;
        await this.certRepo.save(cert);
        return { code: 0, message: '证书已生成', data: cert };
    }
    async updateStatus(id, status) {
        await this.certRepo.update(id, { status });
        const cert = await this.certRepo.findOne({ where: { id } });
        return { code: 0, message: 'success', data: cert };
    }
};
exports.AdminCertificateController = AdminCertificateController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('activityId')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminCertificateController.prototype, "list", null);
__decorate([
    (0, common_1.Post)('generate'),
    __param(0, (0, common_1.Param)('activityId')),
    __param(1, (0, common_1.Body)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminCertificateController.prototype, "generate", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminCertificateController.prototype, "updateStatus", null);
exports.AdminCertificateController = AdminCertificateController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('admin/certificates'),
    __param(0, (0, typeorm_1.InjectRepository)(activity_certificate_entity_1.ActivityCertificate)),
    __param(1, (0, typeorm_1.InjectRepository)(activity_registration_entity_1.ActivityRegistration)),
    __param(2, (0, typeorm_1.InjectRepository)(activity_entity_1.Activity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminCertificateController);
//# sourceMappingURL=admin-certificate.controller.js.map