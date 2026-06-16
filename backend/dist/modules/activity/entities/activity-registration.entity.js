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
exports.ActivityRegistration = void 0;
const typeorm_1 = require("typeorm");
let ActivityRegistration = class ActivityRegistration {
};
exports.ActivityRegistration = ActivityRegistration;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], ActivityRegistration.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'activity_id', type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], ActivityRegistration.prototype, "activityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], ActivityRegistration.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, default: 'REGISTERED' }),
    __metadata("design:type", String)
], ActivityRegistration.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ActivityRegistration.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ActivityRegistration.prototype, "updatedAt", void 0);
exports.ActivityRegistration = ActivityRegistration = __decorate([
    (0, typeorm_1.Entity)('activity_registrations'),
    (0, typeorm_1.Index)(['activityId', 'userId'], { unique: true })
], ActivityRegistration);
//# sourceMappingURL=activity-registration.entity.js.map