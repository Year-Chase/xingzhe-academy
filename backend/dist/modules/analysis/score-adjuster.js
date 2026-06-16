"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeScores = computeScores;
const state_engine_config_1 = require("../../config/state-engine.config");
const cfg = state_engine_config_1.STATE_ENGINE_CONFIG;
function computeScores(x, y) {
    const stressBase = Math.abs(x) * 50 + 50;
    const stressY = Math.max(0, y) * 40;
    const scoreStress = Math.round(Math.min(100, stressBase + stressY));
    const emotionBase = (x + 1) * 50;
    const scoreEmotion = Math.round(Math.max(0, Math.min(100, emotionBase)));
    const composite = scoreStress * (1 - cfg.V) + scoreEmotion * cfg.V;
    const scoreComposite = Math.round(composite);
    return { scoreStress, scoreEmotion, scoreComposite };
}
//# sourceMappingURL=score-adjuster.js.map