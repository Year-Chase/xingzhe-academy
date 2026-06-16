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
exports.SupplementaryTaskService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const supplementary_task_entity_1 = require("./entities/supplementary-task.entity");
let SupplementaryTaskService = class SupplementaryTaskService {
    constructor(repo) {
        this.repo = repo;
    }
    async list() {
        return this.repo.find({ order: { sortOrder: 'ASC' } });
    }
    async create(dto) {
        const t = new supplementary_task_entity_1.SupplementaryTask();
        t.taskCode = dto.taskCode;
        t.title = dto.title;
        t.type = dto.type;
        t.targetVariable = dto.targetVariable || 'none';
        t.options = dto.options || [];
        t.triggerRules = dto.triggerRules || null;
        t.required = dto.required ?? false;
        t.sortOrder = dto.sortOrder ?? 0;
        t.weight = dto.weight ?? 0;
        t.status = 'ENABLED';
        return this.repo.save(t);
    }
    async update(taskCode, dto) {
        await this.repo.update(taskCode, dto);
        return this.repo.findOne({ where: { taskCode } });
    }
    async archive(taskCode) {
        await this.repo.update(taskCode, { status: 'ARCHIVED' });
        return { taskCode, status: 'ARCHIVED' };
    }
    async getEnabled() {
        return this.repo.find({ where: { status: 'ENABLED' }, order: { sortOrder: 'ASC' } });
    }
};
exports.SupplementaryTaskService = SupplementaryTaskService;
exports.SupplementaryTaskService = SupplementaryTaskService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(supplementary_task_entity_1.SupplementaryTask)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SupplementaryTaskService);
//# sourceMappingURL=supplementary-task.service.js.map