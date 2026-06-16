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
exports.DiaryEntry = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
let DiaryEntry = class DiaryEntry {
};
exports.DiaryEntry = DiaryEntry;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], DiaryEntry.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], DiaryEntry.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], DiaryEntry.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], DiaryEntry.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'content_type', type: 'varchar', length: 16, default: 'text' }),
    __metadata("design:type", String)
], DiaryEntry.prototype, "contentType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'audio_url', type: 'varchar', length: 512, nullable: true }),
    __metadata("design:type", String)
], DiaryEntry.prototype, "audioUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'audio_duration', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], DiaryEntry.prototype, "audioDuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'transcript_text', type: 'text', nullable: true }),
    __metadata("design:type", String)
], DiaryEntry.prototype, "transcriptText", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'transcript_status', type: 'varchar', length: 16, nullable: true }),
    __metadata("design:type", String)
], DiaryEntry.prototype, "transcriptStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'word_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DiaryEntry.prototype, "wordCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mood_tag', type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", String)
], DiaryEntry.prototype, "moodTag", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'diary_date', type: 'date' }),
    __metadata("design:type", Date)
], DiaryEntry.prototype, "diaryDate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], DiaryEntry.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], DiaryEntry.prototype, "updatedAt", void 0);
exports.DiaryEntry = DiaryEntry = __decorate([
    (0, typeorm_1.Entity)('diary_entries')
], DiaryEntry);
//# sourceMappingURL=diary-entry.entity.js.map