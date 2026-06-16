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
exports.TaskFlowService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const supplementary_session_entity_1 = require("./entities/supplementary-session.entity");
const state_analysis_entity_1 = require("./entities/state-analysis.entity");
const task_definitions_1 = require("../../config/task-definitions");
let TaskFlowService = class TaskFlowService {
    constructor(sessionRepo, analysisRepo) {
        this.sessionRepo = sessionRepo;
        this.analysisRepo = analysisRepo;
    }
    async prepareSession(params) {
        const sessionId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        const tasks = (0, task_definitions_1.buildTasksForSession)(params.stateCode, params.scoreStress, params.scoreEmotion, params.currentStreak);
        const session = new supplementary_session_entity_1.SupplementarySession();
        session.id = sessionId;
        session.userId = params.userId;
        session.content = params.content;
        session.taskPayload = { tasks };
        session.status = 'INIT';
        await this.sessionRepo.save(session);
        return { sessionId, tasks };
    }
    async completeSession(params) {
        const session = await this.sessionRepo.findOne({
            where: { id: params.sessionId, userId: params.userId },
        });
        if (!session)
            throw new Error('会话不存在');
        session.answerPayload = { answers: params.answers, submittedAt: new Date().toISOString() };
        const validAnswers = params.answers.filter(a => a.value !== null && a.value !== -1);
        if (validAnswers.length === 0) {
            session.status = 'SKIPPED';
            await this.sessionRepo.save(session);
            return { sessionId: session.id, status: 'SKIPPED', stateOut: null, scoresOut: null };
        }
        session.status = 'COMPLETED';
        session.completedAt = new Date();
        await this.sessionRepo.save(session);
        return { sessionId: session.id, status: 'COMPLETED', stateOut: null, scoresOut: null };
    }
};
exports.TaskFlowService = TaskFlowService;
exports.TaskFlowService = TaskFlowService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(supplementary_session_entity_1.SupplementarySession)),
    __param(1, (0, typeorm_1.InjectRepository)(state_analysis_entity_1.StateAnalysis)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], TaskFlowService);
//# sourceMappingURL=task-flow.service.js.map