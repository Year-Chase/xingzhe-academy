"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.textToCoordinate = textToCoordinate;
function textToCoordinate(text) {
    const t = text;
    let x = 0;
    let y = 0;
    const posWords = ['开心', '期待', '成就感', '放松', '好', '顺利', '完成', '恢复', '缓过来', '满意', '喜欢', '舒服'];
    const negWords = ['焦虑', '烦', '崩溃', '累', '疲惫', '压力', '担心', '紧张', '撑不住', '难受', '抑郁', '恐惧'];
    const highWords = ['忙', '赶', '推进', '开会', '交付', '项目', '在搞', '加班', '冲刺', '紧张',
        '焦虑', '压力', '撑不住', '紧绷', '胸口堵', '处理不完', '赶进度'];
    const lowWords = ['躺着', '休息', '放空', '睡觉', '懒', '闲', '发呆', '无聊'];
    for (const w of posWords) {
        if (t.includes(w))
            x += 0.15;
    }
    for (const w of negWords) {
        if (t.includes(w))
            x -= 0.15;
    }
    for (const w of highWords) {
        if (t.includes(w))
            y += 0.15;
    }
    for (const w of lowWords) {
        if (t.includes(w))
            y -= 0.15;
    }
    x = Math.max(-1, Math.min(1, x));
    y = Math.max(-1, Math.min(1, y));
    return {
        x: Math.round(x * 1000) / 1000,
        y: Math.round(y * 1000) / 1000,
        posHit: posWords.filter(w => t.includes(w)),
        negHit: negWords.filter(w => t.includes(w)),
        highHit: highWords.filter(w => t.includes(w)),
        lowHit: lowWords.filter(w => t.includes(w)),
    };
}
//# sourceMappingURL=text-coordinate-mapper.js.map