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
exports.TaskResponse = void 0;
const typeorm_1 = require("typeorm");
let TaskResponse = class TaskResponse {
};
exports.TaskResponse = TaskResponse;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], TaskResponse.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'analysis_id', type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], TaskResponse.prototype, "analysisId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'task_code', type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], TaskResponse.prototype, "taskCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'task_value', type: 'varchar', length: 16, nullable: true }),
    __metadata("design:type", Object)
], TaskResponse.prototype, "taskValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], TaskResponse.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], TaskResponse.prototype, "createdAt", void 0);
exports.TaskResponse = TaskResponse = __decorate([
    (0, typeorm_1.Entity)('task_responses')
], TaskResponse);
//# sourceMappingURL=task-response.entity.js.map