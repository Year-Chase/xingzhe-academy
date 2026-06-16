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
exports.ActivityShareLog = void 0;
const typeorm_1 = require("typeorm");
let ActivityShareLog = class ActivityShareLog {
};
exports.ActivityShareLog = ActivityShareLog;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], ActivityShareLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'activity_id', type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], ActivityShareLog.prototype, "activityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sharer_user_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], ActivityShareLog.prototype, "sharerUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_user_id', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", String)
], ActivityShareLog.prototype, "targetUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'share_channel', type: 'varchar', length: 16, default: 'unknown' }),
    __metadata("design:type", String)
], ActivityShareLog.prototype, "shareChannel", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ActivityShareLog.prototype, "createdAt", void 0);
exports.ActivityShareLog = ActivityShareLog = __decorate([
    (0, typeorm_1.Entity)('activity_share_logs')
], ActivityShareLog);
//# sourceMappingURL=activity-share-log.entity.js.map