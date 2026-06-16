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
exports.InterventionController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const intervention_record_entity_1 = require("./entities/intervention-record.entity");
let InterventionController = class InterventionController {
    constructor(repo) {
        this.repo = repo;
    }
    async record(userId, dto) {
        const r = new intervention_record_entity_1.InterventionRecord();
        r.id = (0, uuid_1.v4)();
        r.userId = userId;
        r.type = dto.type;
        r.durationSeconds = dto.durationSeconds;
        r.completed = dto.completed;
        await this.repo.save(r);
        return { code: 0, message: 'success', data: { id: r.id } };
    }
    async history(userId) {
        const data = await this.repo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 20 });
        return { code: 0, message: 'success', data };
    }
};
exports.InterventionController = InterventionController;
__decorate([
    (0, common_1.Post)('record'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InterventionController.prototype, "record", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InterventionController.prototype, "history", null);
exports.InterventionController = InterventionController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('interventions'),
    __param(0, (0, typeorm_1.InjectRepository)(intervention_record_entity_1.InterventionRecord)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], InterventionController);
//# sourceMappingURL=intervention.controller.js.map