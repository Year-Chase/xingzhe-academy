"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatch = dispatch;
const dispatcher_config_1 = require("../../config/dispatcher.config");
const dispatcher_task_defs_1 = require("./dispatcher-task-defs");
const cfg = dispatcher_config_1.DISPATCHER_CONFIG;
function dispatch(params) {
    const tasks = [];
    const rulesHit = [];
    if (params.scoreStress >= cfg.stressThreshold) {
        const t = dispatcher_task_defs_1.ALL_TASKS.find(t => t.code === 'Q1_CLOSURE');
        if (t) {
            tasks.push(t);
            rulesHit.push('Rule-001:stress');
        }
    }
    if (params.scoreEmotion <= cfg.emotionThreshold) {
        const t = dispatcher_task_defs_1.ALL_TASKS.find(t => t.code === 'Q2_BODY_FEELING');
        if (t) {
            tasks.push(t);
            rulesHit.push('Rule-002:emotion');
        }
    }
    if (params.currentStreak >= cfg.streakThreshold) {
        const t = dispatcher_task_defs_1.ALL_TASKS.find(t => t.code === 'BLIND_POINT_V1');
        if (t) {
            tasks.push(t);
            rulesHit.push('Rule-003:streak');
        }
    }
    if (params.stateCode === 'ST_EXHAUSTION') {
        const existing = new Set(tasks.map(t => t.code));
        for (const t of dispatcher_task_defs_1.ALL_TASKS) {
            if (!existing.has(t.code))
                tasks.push(t);
        }
        rulesHit.push('Rule-004:exhaustion_all');
    }
    return { tasks, rulesHit };
}
//# sourceMappingURL=dispatcher.js.map