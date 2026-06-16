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
exports.ActivityCertificate = void 0;
const typeorm_1 = require("typeorm");
let ActivityCertificate = class ActivityCertificate {
};
exports.ActivityCertificate = ActivityCertificate;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], ActivityCertificate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], ActivityCertificate.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'activity_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], ActivityCertificate.prototype, "activityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'certificate_no', type: 'varchar', length: 32, unique: true }),
    __metadata("design:type", String)
], ActivityCertificate.prototype, "certificateNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'certificate_url', type: 'varchar', length: 512, nullable: true }),
    __metadata("design:type", String)
], ActivityCertificate.prototype, "certificateUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['PENDING', 'GENERATED', 'DOWNLOADED'], default: 'PENDING' }),
    __metadata("design:type", String)
], ActivityCertificate.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'certificate_type', type: 'enum', enum: ['WALKER', 'SPEAKER'], default: 'WALKER' }),
    __metadata("design:type", String)
], ActivityCertificate.prototype, "certificateType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'download_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ActivityCertificate.prototype, "downloadCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ActivityCertificate.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ActivityCertificate.prototype, "updatedAt", void 0);
exports.ActivityCertificate = ActivityCertificate = __decorate([
    (0, typeorm_1.Entity)('activity_certificates'),
    (0, typeorm_1.Index)(['userId', 'activityId'], { unique: true })
], ActivityCertificate);
//# sourceMappingURL=activity-certificate.entity.js.map