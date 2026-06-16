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
exports.FootprintController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const activity_certificate_entity_1 = require("./entities/activity-certificate.entity");
const activity_registration_entity_1 = require("./entities/activity-registration.entity");
const checkin_entity_1 = require("./entities/checkin.entity");
const activity_entity_1 = require("./entities/activity.entity");
let FootprintController = class FootprintController {
    constructor(certRepo, regRepo, checkinRepo, actRepo) {
        this.certRepo = certRepo;
        this.regRepo = regRepo;
        this.checkinRepo = checkinRepo;
        this.actRepo = actRepo;
    }
    async stats(userId) {
        const certs = await this.certRepo.find({ where: { userId } });
        const activityIds = [...new Set(certs.map(c => c.activityId))];
        const activities = activityIds.length > 0 ? await this.actRepo.findByIds(activityIds) : [];
        const cities = new Set(activities.map(a => a.location).filter(Boolean));
        const speakerCount = certs.filter(c => c.certificateType === 'SPEAKER').length;
        const companionIds = new Set();
        for (const aid of activityIds) {
            const checkins = await this.checkinRepo.find({ where: { activityId: aid } });
            checkins.forEach(c => { if (c.userId !== userId)
                companionIds.add(c.userId); });
        }
        return {
            code: 0,
            message: 'success',
            data: {
                activityCount: activityIds.length,
                cityCount: cities.size,
                companionCount: companionIds.size,
                speakerCount,
            },
        };
    }
};
exports.FootprintController = FootprintController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('stats'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FootprintController.prototype, "stats", null);
exports.FootprintController = FootprintController = __decorate([
    (0, common_1.Controller)('footprint'),
    __param(0, (0, typeorm_1.InjectRepository)(activity_certificate_entity_1.ActivityCertificate)),
    __param(1, (0, typeorm_1.InjectRepository)(activity_registration_entity_1.ActivityRegistration)),
    __param(2, (0, typeorm_1.InjectRepository)(checkin_entity_1.Checkin)),
    __param(3, (0, typeorm_1.InjectRepository)(activity_entity_1.Activity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], FootprintController);
//# sourceMappingURL=footprint.controller.js.map