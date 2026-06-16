"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyState = classifyState;
const state_engine_config_1 = require("../../config/state-engine.config");
const cfg = state_engine_config_1.STATE_ENGINE_CONFIG;
function classifyState(x, y, isEntertainment = false) {
    const t = cfg.calmZoneThreshold;
    if (Math.abs(x) <= t && Math.abs(y) <= t) {
        return { stateCode: 'ST_CALM', stateName: '平静状态', step: 1 };
    }
    if (isEntertainment && y < -t) {
        return { stateCode: 'ST_PASSIVE_RELAXATION', stateName: '被动放松', step: 2 };
    }
    if (x < -t && y < -t) {
        return { stateCode: 'ST_EXHAUSTION', stateName: '身心俱疲', step: 3 };
    }
    if (x > t && y > t) {
        return { stateCode: 'ST_POSITIVE_STRESS', stateName: '良性紧张', step: 4 };
    }
    if (x < -t && y > t) {
        return { stateCode: 'ST_NEGATIVE_STRESS', stateName: '紧张状态', step: 5 };
    }
    if (x > t && y < -t) {
        const hour = new Date().getHours();
        const isNight = hour >= cfg.nightWindowStart || hour < cfg.nightWindowEnd;
        if (isNight || isEntertainment) {
            return { stateCode: 'ST_PASSIVE_RELAXATION', stateName: '被动放松', step: 6 };
        }
        return { stateCode: 'ST_TRUE_RELAXATION', stateName: '放松状态', step: 6 };
    }
    if (x < -t || y > t) {
        return { stateCode: 'ST_NEGATIVE_STRESS', stateName: '紧张状态', step: 7 };
    }
    if (y < -t) {
        return { stateCode: 'ST_EXHAUSTION', stateName: '身心俱疲', step: 8 };
    }
    if (x > t) {
        const hour = new Date().getHours();
        const isNight = hour >= cfg.nightWindowStart || hour < cfg.nightWindowEnd;
        if (isNight || isEntertainment) {
            return { stateCode: 'ST_PASSIVE_RELAXATION', stateName: '被动放松', step: 9 };
        }
        return { stateCode: 'ST_TRUE_RELAXATION', stateName: '放松状态', step: 9 };
    }
    return { stateCode: 'ST_CALM', stateName: '平静状态', step: 0 };
}
//# sourceMappingURL=state-classifier.js.map