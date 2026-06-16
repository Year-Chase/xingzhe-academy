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
exports.StateAnalysis = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const diary_entry_entity_1 = require("../../diary/entities/diary-entry.entity");
let StateAnalysis = class StateAnalysis {
};
exports.StateAnalysis = StateAnalysis;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], StateAnalysis.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], StateAnalysis.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], StateAnalysis.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'diary_id', type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], StateAnalysis.prototype, "diaryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => diary_entry_entity_1.DiaryEntry, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'diary_id' }),
    __metadata("design:type", diary_entry_entity_1.DiaryEntry)
], StateAnalysis.prototype, "diary", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_type', type: 'varchar', length: 16, default: 'diary' }),
    __metadata("design:type", String)
], StateAnalysis.prototype, "sourceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tension_score', type: 'decimal', precision: 3, scale: 1 }),
    __metadata("design:type", Number)
], StateAnalysis.prototype, "tensionScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'emotion_valence', type: 'decimal', precision: 3, scale: 1 }),
    __metadata("design:type", Number)
], StateAnalysis.prototype, "emotionValence", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'recovery_level', type: 'decimal', precision: 3, scale: 1 }),
    __metadata("design:type", Number)
], StateAnalysis.prototype, "recoveryLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'duration_level', type: 'decimal', precision: 3, scale: 1 }),
    __metadata("design:type", Number)
], StateAnalysis.prototype, "durationLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'state_type', type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], StateAnalysis.prototype, "stateType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'state_label', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", String)
], StateAnalysis.prototype, "stateLabel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'summary', type: 'text', nullable: true }),
    __metadata("design:type", String)
], StateAnalysis.prototype, "summary", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'evidence', type: 'json', nullable: true }),
    __metadata("design:type", Array)
], StateAnalysis.prototype, "evidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 512 }),
    __metadata("design:type", String)
], StateAnalysis.prototype, "suggestion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 3, scale: 2 }),
    __metadata("design:type", Number)
], StateAnalysis.prototype, "confidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'raw_response', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], StateAnalysis.prototype, "rawResponse", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ai_provider', type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], StateAnalysis.prototype, "aiProvider", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ai_model', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], StateAnalysis.prototype, "aiModel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'x_value', type: 'decimal', precision: 4, scale: 3, nullable: true }),
    __metadata("design:type", Number)
], StateAnalysis.prototype, "xValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'y_value', type: 'decimal', precision: 4, scale: 3, nullable: true }),
    __metadata("design:type", Number)
], StateAnalysis.prototype, "yValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'score_stress', type: 'decimal', precision: 5, scale: 1, nullable: true }),
    __metadata("design:type", Number)
], StateAnalysis.prototype, "scoreStress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'score_emotion', type: 'decimal', precision: 5, scale: 1, nullable: true }),
    __metadata("design:type", Number)
], StateAnalysis.prototype, "scoreEmotion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'score_composite', type: 'decimal', precision: 5, scale: 1, nullable: true }),
    __metadata("design:type", Number)
], StateAnalysis.prototype, "scoreComposite", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'engine_version', type: 'varchar', length: 16, nullable: true }),
    __metadata("design:type", String)
], StateAnalysis.prototype, "engineVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mapper_type', type: 'varchar', length: 8, default: 'rule' }),
    __metadata("design:type", String)
], StateAnalysis.prototype, "mapperType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mapper_provider', type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", String)
], StateAnalysis.prototype, "mapperProvider", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mapper_model', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", String)
], StateAnalysis.prototype, "mapperModel", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], StateAnalysis.prototype, "createdAt", void 0);
exports.StateAnalysis = StateAnalysis = __decorate([
    (0, typeorm_1.Entity)('state_analyses')
], StateAnalysis);
//# sourceMappingURL=state-analysis.entity.js.map