"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUILT_IN_TASKS = void 0;
exports.buildTasksForSession = buildTasksForSession;
exports.BUILT_IN_TASKS = {
    Q1_CLOSURE: {
        taskCode: 'Q1_CLOSURE',
        uiType: 'QUESTIONNAIRE_SINGLE',
        title: '今天计划的事情都收尾了吗？',
        options: [
            { text: '差不多了，心里踏实', value: 0 },
            { text: '还留了一堆烂账', value: 1 },
        ],
        biMapping: { targetVariable: 'q1_val' },
    },
    Q2_BODY_CHECK: {
        taskCode: 'Q2_BODY_CHECK',
        uiType: 'QUESTIONNAIRE_GRID',
        title: '现在身体哪个部位感觉最明显？',
        options: [
            { text: '头部', value: 'head' },
            { text: '肩颈', value: 'neck' },
            { text: '胸口', value: 'chest' },
            { text: '胃部', value: 'stomach' },
            { text: '四肢', value: 'limbs' },
            { text: '没有明显感觉', value: 'none' },
        ],
        biMapping: { targetVariable: 'q2_val' },
    },
    G1_CYCLONE_PAN: {
        taskCode: 'G1_CYCLONE_PAN',
        uiType: 'GAME_BLIND_POINT',
        title: '凭第一直觉，戳一下这团微光的中心',
        options: [],
        config: { randomRotateDegrees: 45 },
        biMapping: { targetVariable: 'x_game' },
    },
};
function buildTasksForSession(stateCode, scoreStress, scoreEmotion, currentStreak) {
    const tasks = [];
    if (scoreStress >= 70 && exports.BUILT_IN_TASKS.Q1_CLOSURE) {
        tasks.push(exports.BUILT_IN_TASKS.Q1_CLOSURE);
    }
    if (scoreEmotion <= 30 && exports.BUILT_IN_TASKS.Q2_BODY_CHECK) {
        tasks.push(exports.BUILT_IN_TASKS.Q2_BODY_CHECK);
    }
    if (currentStreak >= 3 && exports.BUILT_IN_TASKS.G1_CYCLONE_PAN) {
        tasks.push(exports.BUILT_IN_TASKS.G1_CYCLONE_PAN);
    }
    if (stateCode === 'ST_EXHAUSTION') {
        const existing = new Set(tasks.map(t => t.taskCode));
        for (const t of Object.values(exports.BUILT_IN_TASKS)) {
            if (!existing.has(t.taskCode))
                tasks.push(t);
        }
    }
    return tasks;
}
//# sourceMappingURL=task-definitions.js.map