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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplementaryTaskController = void 0;
const common_1 = require("@nestjs/common");
const supplementary_task_service_1 = require("./supplementary-task.service");
let SupplementaryTaskController = class SupplementaryTaskController {
    constructor(service) {
        this.service = service;
    }
    async list() {
        const data = await this.service.list();
        return { code: 0, message: 'success', data };
    }
    async create(dto) {
        const data = await this.service.create(dto);
        return { code: 0, message: 'success', data };
    }
    async update(taskCode, dto) {
        const data = await this.service.update(taskCode, dto);
        return { code: 0, message: 'success', data };
    }
    async archive(taskCode) {
        const data = await this.service.archive(taskCode);
        return { code: 0, message: 'success', data };
    }
};
exports.SupplementaryTaskController = SupplementaryTaskController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SupplementaryTaskController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SupplementaryTaskController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':taskCode'),
    __param(0, (0, common_1.Param)('taskCode')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SupplementaryTaskController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':taskCode'),
    __param(0, (0, common_1.Param)('taskCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SupplementaryTaskController.prototype, "archive", null);
exports.SupplementaryTaskController = SupplementaryTaskController = __decorate([
    (0, common_1.Controller)('admin/supplementary-tasks'),
    __metadata("design:paramtypes", [supplementary_task_service_1.SupplementaryTaskService])
], SupplementaryTaskController);
//# sourceMappingURL=supplementary-task.controller.js.map