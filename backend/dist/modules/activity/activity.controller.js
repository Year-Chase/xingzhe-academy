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
exports.ActivityController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const activity_entity_1 = require("./entities/activity.entity");
const activity_registration_entity_1 = require("./entities/activity-registration.entity");
const activity_share_log_entity_1 = require("./entities/activity-share-log.entity");
let ActivityController = class ActivityController {
    constructor(repo, regRepo, shareLogRepo) {
        this.repo = repo;
        this.regRepo = regRepo;
        this.shareLogRepo = shareLogRepo;
    }
    async list(status) {
        const where = status ? { status } : { status: 'PUBLISHED' };
        const data = await this.repo.find({ where, order: { startTime: 'ASC' }, take: 50 });
        return { code: 0, message: 'success', data };
    }
    async myActivities(userId) {
        const regs = await this.regRepo.find({ where: { userId, status: 'REGISTERED' }, order: { createdAt: 'DESC' } });
        if (regs.length === 0)
            return { code: 0, message: 'success', data: [] };
        const ids = [...new Set(regs.map(r => r.activityId))];
        const activities = await this.repo.findByIds(ids);
        const map = new Map(activities.map(a => [a.id, a]));
        return { code: 0, message: 'success', data: regs.map(r => ({ ...r, activity: map.get(r.activityId) || null })).filter(r => r.activity) };
    }
    async detail(id, userId) {
        const data = await this.repo.findOne({ where: { id } });
        if (!data)
            return { code: 10002, message: '活动不存在', data: null };
        const count = await this.regRepo.count({ where: { activityId: id, status: 'REGISTERED' } });
        let inviteBound = false;
        const reg = await this.regRepo.findOne({ where: { activityId: id, userId } }).catch(() => null);
        const isRegistered = !!reg && reg.status === 'REGISTERED';
        const regStatus = reg?.status || null;
        return { code: 0, message: 'success', data: { ...data, registeredCount: count, isRegistered, registrationStatus: regStatus } };
    }
    async logShare(id, userId, dto) {
        const sl = new activity_share_log_entity_1.ActivityShareLog();
        sl.id = (0, uuid_1.v4)();
        sl.activityId = id;
        sl.sharerUserId = userId;
        sl.shareChannel = dto.channel || 'friend';
        await this.shareLogRepo.save(sl);
        return { code: 0, message: 'success', data: { id: sl.id } };
    }
    async register(id, userId) {
        const activity = await this.repo.findOne({ where: { id } });
        if (!activity)
            return { code: 10002, message: '活动不存在', data: null };
        if (activity.status !== 'PUBLISHED')
            return { code: 40406, message: '活动不在报名期', data: null };
        if (activity.price > 0) {
            return { code: 40501, message: '请先完成支付', data: { requiresPayment: true, amount: activity.price } };
        }
        if (activity.capacity) {
            const count = await this.regRepo.count({ where: { activityId: id, status: 'REGISTERED' } });
            if (count >= activity.capacity)
                return { code: 10003, message: '这个活动暂时已满，你可以关注后续场次', data: null };
        }
        let regRecord = await this.regRepo.findOne({ where: { activityId: id, userId } });
        if (regRecord) {
            if (regRecord.status === 'REGISTERED')
                return { code: 10003, message: '你已经报名过这个活动了', data: null };
            regRecord.status = 'REGISTERED';
        }
        else {
            regRecord = new activity_registration_entity_1.ActivityRegistration();
            regRecord.id = (0, uuid_1.v4)();
            regRecord.activityId = id;
            regRecord.userId = userId;
            regRecord.status = 'REGISTERED';
        }
        await this.regRepo.save(regRecord);
        return { code: 0, message: '报名成功', data: { id: regRecord.id, status: regRecord.status } };
    }
    async cancel(id, userId) {
        const regRecord = await this.regRepo.findOne({ where: { activityId: id, userId } });
        if (!regRecord)
            return { code: 10002, message: '未找到报名记录', data: null };
        regRecord.status = 'CANCELLED';
        await this.regRepo.save(regRecord);
        return { code: 0, message: '已取消报名', data: { id: regRecord.id, status: regRecord.status } };
    }
};
exports.ActivityController = ActivityController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ActivityController.prototype, "list", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('my/list'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ActivityController.prototype, "myActivities", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ActivityController.prototype, "detail", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/share'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ActivityController.prototype, "logShare", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/register'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ActivityController.prototype, "register", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id/register'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ActivityController.prototype, "cancel", null);
exports.ActivityController = ActivityController = __decorate([
    (0, common_1.Controller)('activities'),
    __param(0, (0, typeorm_1.InjectRepository)(activity_entity_1.Activity)),
    __param(1, (0, typeorm_1.InjectRepository)(activity_registration_entity_1.ActivityRegistration)),
    __param(2, (0, typeorm_1.InjectRepository)(activity_share_log_entity_1.ActivityShareLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ActivityController);
//# sourceMappingURL=activity.controller.js.map