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
exports.InterventionRecord = void 0;
const typeorm_1 = require("typeorm");
let InterventionRecord = class InterventionRecord {
};
exports.InterventionRecord = InterventionRecord;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], InterventionRecord.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], InterventionRecord.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], InterventionRecord.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'duration_seconds', type: 'int' }),
    __metadata("design:type", Number)
], InterventionRecord.prototype, "durationSeconds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], InterventionRecord.prototype, "completed", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], InterventionRecord.prototype, "createdAt", void 0);
exports.InterventionRecord = InterventionRecord = __decorate([
    (0, typeorm_1.Entity)('intervention_records')
], InterventionRecord);
//# sourceMappingURL=intervention-record.entity.js.map