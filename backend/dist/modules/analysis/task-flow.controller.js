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
exports.TaskFlowController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const task_flow_service_1 = require("./task-flow.service");
let TaskFlowController = class TaskFlowController {
    constructor(taskFlowService) {
        this.taskFlowService = taskFlowService;
    }
    async prepare(userId, dto) {
        console.log('[Supplementary] prepare start — userId=', userId, 'stateCode=', dto.stateCode, 'stress=', dto.scoreStress, 'emotion=', dto.scoreEmotion);
        if (!dto.content) {
            return { code: 10001, message: '缺少 content', data: null };
        }
        const result = await this.taskFlowService.prepareSession({
            userId,
            content: dto.content.slice(0, 200),
            stateCode: dto.stateCode || 'ST_CALM',
            scoreStress: dto.scoreStress ?? 50,
            scoreEmotion: dto.scoreEmotion ?? 50,
            currentStreak: dto.currentStreak ?? 0,
        });
        console.log('[Supplementary] prepare result — sessionId=', result.sessionId, 'tasksLength=', result.tasks.length, 'tasks=', result.tasks.map((t) => t.taskCode));
        return { code: 0, message: 'success', data: result };
    }
    async complete(userId, dto) {
        if (!dto.sessionId) {
            return { code: 10001, message: '缺少 sessionId', data: null };
        }
        const result = await this.taskFlowService.completeSession({
            sessionId: dto.sessionId,
            userId,
            answers: dto.answers || [],
        });
        return { code: 0, message: 'success', data: result };
    }
};
exports.TaskFlowController = TaskFlowController;
__decorate([
    (0, common_1.Post)('tasks/prepare'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TaskFlowController.prototype, "prepare", null);
__decorate([
    (0, common_1.Post)('tasks/complete'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TaskFlowController.prototype, "complete", null);
exports.TaskFlowController = TaskFlowController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('analysis'),
    __metadata("design:paramtypes", [task_flow_service_1.TaskFlowService])
], TaskFlowController);
//# sourceMappingURL=task-flow.controller.js.map