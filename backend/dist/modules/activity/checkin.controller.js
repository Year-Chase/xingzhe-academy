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
exports.AdminCheckinController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const certificate_service_1 = require("./certificate.service");
const checkin_entity_1 = require("./entities/checkin.entity");
const activity_registration_entity_1 = require("./entities/activity-registration.entity");
let AdminCheckinController = class AdminCheckinController {
    constructor(checkinRepo, regRepo, certificateService) {
        this.checkinRepo = checkinRepo;
        this.regRepo = regRepo;
        this.certificateService = certificateService;
    }
    async list(activityId) {
        const where = {};
        if (activityId)
            where.activityId = activityId;
        const data = await this.checkinRepo.find({ where, order: { createdAt: 'DESC' }, take: 200 });
        return { code: 0, message: 'success', data };
    }
    async byActivity(activityId) {
        const data = await this.checkinRepo.find({
            where: { activityId },
            order: { createdAt: 'DESC' },
        });
        return { code: 0, message: 'success', data };
    }
    async manual(dto) {
        const { activityId, userId, verifiedBy } = dto;
        if (!activityId || !userId) {
            return { code: 10001, message: '缺少 activityId 或 userId', data: null };
        }
        const reg = await this.regRepo.findOne({ where: { activityId, userId, status: 'REGISTERED' } });
        if (!reg)
            return { code: 10003, message: '该用户未报名此活动', data: null };
        const existing = await this.checkinRepo.findOne({ where: { activityId, userId } });
        if (existing)
            return { code: 10003, message: '该用户已签到，不可重复签到', data: null };
        const checkin = new checkin_entity_1.Checkin();
        checkin.id = (0, uuid_1.v4)();
        checkin.activityId = activityId;
        checkin.registrationId = reg.id;
        checkin.userId = userId;
        checkin.checkinMethod = 'MANUAL';
        checkin.verifiedBy = verifiedBy || 'admin';
        await this.checkinRepo.save(checkin);
        const certResult = await this.certificateService.generateAfterCheckin(activityId, userId);
        return {
            code: 0,
            message: '签到成功',
            data: { id: checkin.id, createdAt: checkin.createdAt, certificate: certResult },
        };
    }
    async scan(dto) {
        const { code, activityId, verifiedBy } = dto;
        if (!code || !activityId) {
            return { code: 10001, message: '缺少 code 或 activityId', data: null };
        }
        const reg = await this.regRepo.findOne({ where: { activityId, userId: code, status: 'REGISTERED' } });
        if (!reg)
            return { code: 10003, message: '核销码无效或用户未报名', data: null };
        const existing = await this.checkinRepo.findOne({ where: { activityId, userId: code } });
        if (existing)
            return { code: 10003, message: '该用户已签到', data: null };
        const checkin = new checkin_entity_1.Checkin();
        checkin.id = (0, uuid_1.v4)();
        checkin.activityId = activityId;
        checkin.registrationId = reg.id;
        checkin.userId = code;
        checkin.checkinMethod = 'QR_SCAN';
        checkin.verifiedBy = verifiedBy || 'admin';
        await this.checkinRepo.save(checkin);
        const certResult = await this.certificateService.generateAfterCheckin(activityId, code);
        return {
            code: 0,
            message: '签到成功',
            data: { id: checkin.id, createdAt: checkin.createdAt, certificate: certResult },
        };
    }
};
exports.AdminCheckinController = AdminCheckinController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('activityId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminCheckinController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('activity/:activityId'),
    __param(0, (0, common_1.Param)('activityId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminCheckinController.prototype, "byActivity", null);
__decorate([
    (0, common_1.Post)('manual'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminCheckinController.prototype, "manual", null);
__decorate([
    (0, common_1.Post)('scan'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminCheckinController.prototype, "scan", null);
exports.AdminCheckinController = AdminCheckinController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('admin/checkins'),
    __param(0, (0, typeorm_1.InjectRepository)(checkin_entity_1.Checkin)),
    __param(1, (0, typeorm_1.InjectRepository)(activity_registration_entity_1.ActivityRegistration)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        certificate_service_1.CertificateService])
], AdminCheckinController);
//# sourceMappingURL=checkin.controller.js.map