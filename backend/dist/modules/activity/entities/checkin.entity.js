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
exports.Checkin = void 0;
const typeorm_1 = require("typeorm");
let Checkin = class Checkin {
};
exports.Checkin = Checkin;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], Checkin.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'activity_id', type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], Checkin.prototype, "activityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'registration_id', type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], Checkin.prototype, "registrationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], Checkin.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'checkin_method', type: 'varchar', length: 16, default: 'MANUAL' }),
    __metadata("design:type", String)
], Checkin.prototype, "checkinMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'verified_by', type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", String)
], Checkin.prototype, "verifiedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Checkin.prototype, "createdAt", void 0);
exports.Checkin = Checkin = __decorate([
    (0, typeorm_1.Entity)('checkins')
], Checkin);
//# sourceMappingURL=checkin.entity.js.map