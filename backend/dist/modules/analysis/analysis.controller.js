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
exports.AnalysisController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const analysis_service_1 = require("./analysis.service");
const analyze_dto_1 = require("./dto/analyze.dto");
const dispatcher_1 = require("./dispatcher");
let AnalysisController = class AnalysisController {
    constructor(analysisService) {
        this.analysisService = analysisService;
    }
    async analyze(userId, dto) {
        const result = await this.analysisService.analyze(userId, dto.diaryId);
        return {
            code: 0,
            message: 'success',
            data: this.formatV02(result),
        };
    }
    async getTrend(userId, days) {
        const data = await this.analysisService.getTrend(userId, days || 7);
        return { code: 0, message: 'success', data };
    }
    async getContinuity(userId) {
        try {
            const data = await this.analysisService.getContinuity(userId);
            return { code: 0, message: 'success', data };
        }
        catch (e) {
            return {
                code: 0,
                message: 'success',
                data: {
                    currentStreak: 0, longestStreak: 0,
                    totalDays: 0, totalRecords: 0,
                    voiceCount: 0, textCount: 0,
                    latestDelta: null, timeline: [],
                },
            };
        }
    }
    async getReview(userId, days) {
        const data = await this.analysisService.getReview(userId, days || 7);
        return { code: 0, message: 'success', data };
    }
    async getTasks(userId, analysisId) {
        const analysis = await this.analysisService.findById(analysisId);
        if (!analysis) {
            return { code: 10002, message: '分析不存在', data: null };
        }
        const answeredMap = await this.analysisService.getTaskResponses(analysisId);
        const result = (0, dispatcher_1.dispatch)({
            stateCode: analysis.stateType,
            scoreStress: Number(analysis.scoreStress || 0),
            scoreEmotion: Number(analysis.scoreEmotion || 0),
            currentStreak: 0,
        });
        const tasksWithStatus = result.tasks.map(t => ({
            ...t,
            answered: answeredMap.has(t.code),
            taskValue: answeredMap.get(t.code) ?? null,
        }));
        console.log(`[Dispatcher] analysisId=${analysisId}, stateCode=${analysis.stateType}, rules=[${result.rulesHit.join(', ')}], tasks=[${tasksWithStatus.map(t => `${t.code}(answered=${t.answered})`).join(', ')}]`);
        return { code: 0, message: 'success', data: { analysisId, tasks: tasksWithStatus, rulesHit: result.rulesHit } };
    }
    async submitTask(userId, dto) {
        if (!dto.analysisId || !dto.taskCode) {
            return { code: 10001, message: '缺少参数', data: null };
        }
        const saved = await this.analysisService.submitTaskResponse(userId, dto.analysisId, dto.taskCode, dto.value ?? null);
        return { code: 0, message: 'success', data: { id: saved.id, taskCode: saved.taskCode, taskValue: saved.taskValue } };
    }
    async submitFeedback(userId, dto) {
        if (!dto.analysisId || dto.feedbackScore == null) {
            return { code: 10001, message: '缺少参数', data: null };
        }
        const saved = await this.analysisService.submitFeedback(userId, dto.analysisId, dto.feedbackScore, dto.correctedState ?? null);
        return { code: 0, message: 'success', data: { id: saved.id, feedbackScore: saved.feedbackScore } };
    }
    async getTrajectory(userId) {
        const data = await this.analysisService.getTrajectory(userId);
        return { code: 0, message: 'success', data };
    }
    async getMapperStats() {
        const data = await this.analysisService.getMapperStats();
        return { code: 0, message: 'success', data };
    }
    async getCalibration() {
        const data = await this.analysisService.getCalibration();
        return { code: 0, message: 'success', data };
    }
    async getDebugLatest(limit) {
        const data = await this.analysisService.getDebugLatest(limit || 20);
        return { code: 0, message: 'success', data };
    }
    async getLatest(userId) {
        const result = await this.analysisService.getLatest(userId);
        if (!result) {
            return { code: 0, message: '暂无分析记录', data: null };
        }
        return {
            code: 0,
            message: 'success',
            data: this.formatV02(result),
        };
    }
    formatV02(entity) {
        const raw = entity.rawResponse || {};
        const v02 = raw.v02 ? raw.result : null;
        return {
            id: entity.id,
            tensionScore: v02?.tensionScore ?? Math.round(entity.tensionScore * 10),
            emotion: v02?.emotion ?? this.valenceToEmotion(entity.emotionValence),
            recoveryLevel: v02?.recoveryLevel ?? this.numToRecovery(entity.recoveryLevel),
            durationLevel: v02?.durationLevel ?? this.numToDuration(entity.durationLevel),
            stateCode: entity.stateType || 'neutral_observation',
            stateLabel: entity.stateLabel || '观察中',
            summary: entity.summary || raw.result?.summary || '',
            evidence: Array.isArray(entity.evidence) ? entity.evidence : [],
            suggestion: entity.suggestion || '',
            confidence: entity.confidence,
            aiProvider: entity.aiProvider,
            createdAt: entity.createdAt,
            scoreStress: entity.scoreStress,
            scoreEmotion: entity.scoreEmotion,
            scoreComposite: entity.scoreComposite,
            xValue: entity.xValue,
            yValue: entity.yValue,
            engineVersion: entity.engineVersion,
        };
    }
    valenceToEmotion(v) {
        if (v == null)
            return 'neutral';
        if (v > 1.5)
            return 'positive';
        if (v < -1.5)
            return 'negative';
        return 'neutral';
    }
    numToRecovery(r) {
        if (r == null)
            return 'medium';
        if (r >= 7)
            return 'high';
        if (r <= 3)
            return 'low';
        return 'medium';
    }
    numToDuration(d) {
        if (d == null)
            return 'medium';
        if (d >= 7)
            return 'long';
        if (d <= 3)
            return 'short';
        return 'medium';
    }
};
exports.AnalysisController = AnalysisController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, analyze_dto_1.AnalyzeDto]),
    __metadata("design:returntype", Promise)
], AnalysisController.prototype, "analyze", null);
__decorate([
    (0, common_1.Get)('trend'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], AnalysisController.prototype, "getTrend", null);
__decorate([
    (0, common_1.Get)('continuity'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalysisController.prototype, "getContinuity", null);
__decorate([
    (0, common_1.Get)('review'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], AnalysisController.prototype, "getReview", null);
__decorate([
    (0, common_1.Get)('tasks/:analysisId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Param)('analysisId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnalysisController.prototype, "getTasks", null);
__decorate([
    (0, common_1.Post)('tasks/submit'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AnalysisController.prototype, "submitTask", null);
__decorate([
    (0, common_1.Post)('feedback'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AnalysisController.prototype, "submitFeedback", null);
__decorate([
    (0, common_1.Get)('trajectory'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalysisController.prototype, "getTrajectory", null);
__decorate([
    (0, common_1.Get)('mapper-stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalysisController.prototype, "getMapperStats", null);
__decorate([
    (0, common_1.Get)('calibration'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalysisController.prototype, "getCalibration", null);
__decorate([
    (0, common_1.Get)('debug/latest'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AnalysisController.prototype, "getDebugLatest", null);
__decorate([
    (0, common_1.Get)('latest'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalysisController.prototype, "getLatest", null);
exports.AnalysisController = AnalysisController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('analysis'),
    __metadata("design:paramtypes", [analysis_service_1.AnalysisService])
], AnalysisController);
//# sourceMappingURL=analysis.controller.js.map