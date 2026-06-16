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
exports.SpeechController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const speech_service_1 = require("./speech.service");
class CreateTaskDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "audioUrl", void 0);
let SpeechController = class SpeechController {
    constructor(speechService) {
        this.speechService = speechService;
    }
    async create(dto) {
        try {
            const result = await this.speechService.createTask(dto.audioUrl);
            return {
                code: 0,
                message: 'success',
                data: { taskId: result.taskId },
            };
        }
        catch (e) {
            return {
                code: 40601,
                message: e.message || '创建识别任务失败',
                data: null,
            };
        }
    }
    async queryStatus(taskId) {
        try {
            const result = await this.speechService.queryTask(taskId);
            if (result.status === 3) {
                return {
                    code: 40601,
                    message: result.errorMsg || '识别失败',
                    data: { status: 3, text: '' },
                };
            }
            return {
                code: 0,
                message: 'success',
                data: {
                    status: result.status,
                    text: result.text,
                },
            };
        }
        catch (e) {
            return {
                code: 40601,
                message: e.message || '查询任务状态失败',
                data: null,
            };
        }
    }
};
exports.SpeechController = SpeechController;
__decorate([
    (0, common_1.Post)('transcribe'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateTaskDto]),
    __metadata("design:returntype", Promise)
], SpeechController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('task-status/:taskId'),
    __param(0, (0, common_1.Param)('taskId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SpeechController.prototype, "queryStatus", null);
exports.SpeechController = SpeechController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('speech'),
    __metadata("design:paramtypes", [speech_service_1.SpeechService])
], SpeechController);
//# sourceMappingURL=speech.controller.js.map