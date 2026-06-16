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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplementarySession = void 0;
const typeorm_1 = require("typeorm");
let SupplementarySession = class SupplementarySession {
};
exports.SupplementarySession = SupplementarySession;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], SupplementarySession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], SupplementarySession.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SupplementarySession.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'task_payload', type: 'json' }),
    __metadata("design:type", Object)
], SupplementarySession.prototype, "taskPayload", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'answer_payload', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], SupplementarySession.prototype, "answerPayload", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'INIT' }),
    __metadata("design:type", String)
], SupplementarySession.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'analysis_id', type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], SupplementarySession.prototype, "analysisId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], SupplementarySession.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], SupplementarySession.prototype, "completedAt", void 0);
exports.SupplementarySession = SupplementarySession = __decorate([
    (0, typeorm_1.Entity)('supplementary_task_sessions')
], SupplementarySession);
//# sourceMappingURL=supplementary-session.entity.js.map