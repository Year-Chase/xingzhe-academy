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
exports.AdminActivityController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const activity_entity_1 = require("./entities/activity.entity");
const activity_registration_entity_1 = require("./entities/activity-registration.entity");
const activity_share_log_entity_1 = require("./entities/activity-share-log.entity");
let AdminActivityController = class AdminActivityController {
    constructor(repo, regRepo, shareLogRepo) {
        this.repo = repo;
        this.regRepo = regRepo;
        this.shareLogRepo = shareLogRepo;
    }
    async list() {
        const data = await this.repo.find({ order: { createdAt: 'DESC' } });
        const result = await Promise.all(data.map(async (a) => {
            const [regCount, shareCount] = await Promise.all([
                this.regRepo.count({ where: { activityId: a.id, status: 'REGISTERED' } }),
                this.shareLogRepo.count({ where: { activityId: a.id } }),
            ]);
            return { ...a, registeredCount: regCount, shareCount };
        }));
        return { code: 0, message: 'success', data: result };
    }
    async registrations(id) {
        const regs = await this.regRepo.find({ where: { activityId: id }, order: { createdAt: 'DESC' } });
        return { code: 0, message: 'success', data: regs };
    }
    async stats(id) {
        const [regCount, shareCount] = await Promise.all([
            this.regRepo.count({ where: { activityId: id, status: 'REGISTERED' } }),
            this.shareLogRepo.count({ where: { activityId: id } }),
        ]);
        return { code: 0, message: 'success', data: { registeredCount: regCount, shareCount } };
    }
    async create(dto) {
        const a = new activity_entity_1.Activity();
        a.id = (0, uuid_1.v4)();
        a.title = dto.title;
        a.cover = dto.cover;
        a.summary = dto.summary;
        a.content = dto.content;
        a.startTime = dto.startTime;
        a.endTime = dto.endTime;
        a.location = dto.location;
        a.organizer = dto.organizer || '行者学社';
        a.price = dto.price ?? 0;
        a.capacity = dto.capacity;
        a.status = dto.status || 'DRAFT';
        a.photos = dto.photos || null;
        a.speakerId = dto.speakerId || null;
        a.whitelistEnabled = dto.whitelistEnabled ?? 0;
        await this.repo.save(a);
        return { code: 0, message: 'success', data: a };
    }
    async update(id, dto) {
        await this.repo.update(id, dto);
        const data = await this.repo.findOne({ where: { id } });
        return { code: 0, message: 'success', data };
    }
    async cancel(id) {
        const activity = await this.repo.findOne({ where: { id } });
        if (!activity)
            return { code: 10002, message: '活动不存在', data: null };
        if (activity.status === 'CANCELLED')
            return { code: 10003, message: '活动已取消', data: null };
        await this.repo.update(id, { status: 'CANCELLED' });
        const updated = await this.repo.findOne({ where: { id } });
        return { code: 0, message: '活动已取消', data: updated };
    }
};
exports.AdminActivityController = AdminActivityController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminActivityController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id/registrations'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminActivityController.prototype, "registrations", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminActivityController.prototype, "stats", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminActivityController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminActivityController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminActivityController.prototype, "cancel", null);
exports.AdminActivityController = AdminActivityController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('admin/activities'),
    __param(0, (0, typeorm_1.InjectRepository)(activity_entity_1.Activity)),
    __param(1, (0, typeorm_1.InjectRepository)(activity_registration_entity_1.ActivityRegistration)),
    __param(2, (0, typeorm_1.InjectRepository)(activity_share_log_entity_1.ActivityShareLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminActivityController);
//# sourceMappingURL=admin-activity.controller.js.map