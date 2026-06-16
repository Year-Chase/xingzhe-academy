"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const analysis_controller_1 = require("./analysis.controller");
const analysis_service_1 = require("./analysis.service");
const state_analysis_entity_1 = require("./entities/state-analysis.entity");
const diary_entry_entity_1 = require("../diary/entities/diary-entry.entity");
const task_response_entity_1 = require("./entities/task-response.entity");
const state_feedback_entity_1 = require("./entities/state-feedback.entity");
const supplementary_session_entity_1 = require("./entities/supplementary-session.entity");
const task_flow_controller_1 = require("./task-flow.controller");
const task_flow_service_1 = require("./task-flow.service");
let AnalysisModule = class AnalysisModule {
};
exports.AnalysisModule = AnalysisModule;
exports.AnalysisModule = AnalysisModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([state_analysis_entity_1.StateAnalysis, diary_entry_entity_1.DiaryEntry, task_response_entity_1.TaskResponse, state_feedback_entity_1.StateFeedback, supplementary_session_entity_1.SupplementarySession])],
        controllers: [analysis_controller_1.AnalysisController, task_flow_controller_1.TaskFlowController],
        providers: [analysis_service_1.AnalysisService, task_flow_service_1.TaskFlowService],
        exports: [analysis_service_1.AnalysisService],
    })
], AnalysisModule);
//# sourceMappingURL=analysis.module.js.map