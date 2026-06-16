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
exports.SupplementaryTask = void 0;
const typeorm_1 = require("typeorm");
let SupplementaryTask = class SupplementaryTask {
};
exports.SupplementaryTask = SupplementaryTask;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], SupplementaryTask.prototype, "taskCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 256 }),
    __metadata("design:type", String)
], SupplementaryTask.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['QUESTIONNAIRE', 'BODY_CHECK', 'MANUAL_GAME'] }),
    __metadata("design:type", String)
], SupplementaryTask.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_variable', type: 'varchar', length: 32, default: 'none' }),
    __metadata("design:type", String)
], SupplementaryTask.prototype, "targetVariable", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json' }),
    __metadata("design:type", Object)
], SupplementaryTask.prototype, "options", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'trigger_rules', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], SupplementaryTask.prototype, "triggerRules", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], SupplementaryTask.prototype, "required", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['ENABLED', 'DISABLED', 'ARCHIVED'], default: 'DISABLED' }),
    __metadata("design:type", String)
], SupplementaryTask.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sort_order', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SupplementaryTask.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SupplementaryTask.prototype, "weight", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], SupplementaryTask.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], SupplementaryTask.prototype, "updatedAt", void 0);
exports.SupplementaryTask = SupplementaryTask = __decorate([
    (0, typeorm_1.Entity)('supplementary_tasks')
], SupplementaryTask);
//# sourceMappingURL=supplementary-task.entity.js.map