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
exports.StateFeedback = void 0;
const typeorm_1 = require("typeorm");
let StateFeedback = class StateFeedback {
};
exports.StateFeedback = StateFeedback;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], StateFeedback.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'analysis_id', type: 'varchar', length: 36, unique: true }),
    __metadata("design:type", String)
], StateFeedback.prototype, "analysisId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], StateFeedback.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'predicted_state', type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], StateFeedback.prototype, "predictedState", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'feedback_score', type: 'tinyint', nullable: true }),
    __metadata("design:type", Number)
], StateFeedback.prototype, "feedbackScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'corrected_state', type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", Object)
], StateFeedback.prototype, "correctedState", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], StateFeedback.prototype, "createdAt", void 0);
exports.StateFeedback = StateFeedback = __decorate([
    (0, typeorm_1.Entity)('state_feedbacks')
], StateFeedback);
//# sourceMappingURL=state-feedback.entity.js.map