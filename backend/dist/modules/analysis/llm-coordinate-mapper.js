"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmToCoordinate = llmToCoordinate;
const llm_mapper_config_1 = require("../../config/llm-mapper.config");
function buildSystemPrompt(meta) {
    const hour = meta.localHour ?? new Date().getHours();
    const night = meta.isNight ?? (hour >= 23 || hour < 5);
    return `你是 TenseLog 状态坐标映射器。根据用户日记文本与上下文事实，输出严格 JSON。

--- 上下文事实 ---
用户当地挂钟时间: ${hour} 点
深夜窗口 (23:00-05:00): ${night ? '是' : '否'}
问卷1 (任务收尾状态): ${meta.q1Val != null ? (meta.q1Val === 0 ? '已收尾' : '留了一堆烂账') : '未采集'}
问卷2 (身体感受): ${meta.q2Val != null ? (String(meta.q2Val) === 'none' ? '无明显感觉' : '有明显部位感觉') : '未采集'}

--- 坐标定义 ---
X = 情绪/掌控感方向
  正值: 积极、可控、有推进感、有恢复感
  负值: 失控、消极、焦虑、无力、崩溃
Y = 唤醒/紧张水平
  正值: 高唤醒、忙碌、紧绷、压力、赶进度
  负值: 低唤醒、休息、放松、疲惫、想躺下

--- 核心判定规则 ---
"装饰性紧张/良性紧张/积极投入中的压力"不能简单识别成负向紧张。
如用户表现出"有目标推进感、有掌控感、知晓自己在解决问题"，应判定 X > 0。
判断时请综合考虑：是否有掌控感、是否在推进目标、是否可承受压力、是否伴随失控崩溃耗竭。

--- Few-Shot 示例 ---
1. 输入: "今天完成了既定任务，紧张地度过了一天。"
   输出: {"x":0.45,"y":0.55,"isEntertainment":false,"reason":"有紧张感但任务完成且有掌控感，良性紧张"}

2. 输入: "今天项目很赶，但我知道自己在推进，虽然累但还算有节奏。"
   输出: {"x":0.35,"y":0.65,"isEntertainment":false,"reason":"高压力但仍存掌控感和目标推进，良性紧张"}

3. 输入: "今天很焦虑，事情完全处理不完，感觉快撑不住了。"
   输出: {"x":-0.75,"y":0.8,"isEntertainment":false,"reason":"压力伴随失控感和撑不住，负向紧张"}

4. 输入: "今天什么都不想做，只想躺着，感觉身体被掏空。"
   输出: {"x":-0.8,"y":-0.75,"isEntertainment":false,"reason":"低唤醒且明显耗竭，身心俱疲"}

5. 输入: "跑完步之后整个人放松很多，感觉身体舒展开了。"
   输出: {"x":0.75,"y":-0.55,"isEntertainment":false,"reason":"主动恢复行为带来积极低唤醒，主动放松"}

6. 输入: "很累，但就是想刷会短视频，不想面对事情。"
   输出: {"x":0.2,"y":-0.55,"isEntertainment":true,"reason":"通过娱乐逃避压力，被动放松倾向"}

仅返回 JSON: {"x":number,"y":number,"isEntertainment":boolean,"reason":"string"}，不要其他内容。`;
}
async function llmToCoordinate(content, meta) {
    const cfg = (0, llm_mapper_config_1.getLLMConfig)();
    if (!cfg.enabled || !cfg.apiKey) {
        return { result: null, latency: 0, fallback: true, error: 'disabled or no key' };
    }
    const start = Date.now();
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), cfg.timeout);
        const systemPrompt = buildSystemPrompt(meta || {});
        const res = await fetch(`${cfg.baseURL}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cfg.apiKey}` },
            body: JSON.stringify({
                model: cfg.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content },
                ],
                max_tokens: cfg.maxTokens, temperature: cfg.temperature,
            }),
            signal: controller.signal,
        });
        clearTimeout(timer);
        const latency = Date.now() - start;
        if (!res.ok) {
            console.warn(`[LLMMapper] HTTP ${res.status}`);
            return { result: null, latency, fallback: true, error: `HTTP ${res.status}` };
        }
        const json = await res.json();
        const raw = json.choices?.[0]?.message?.content || '';
        const parsed = parseLLMResponse(raw);
        if (!parsed) {
            console.warn(`[LLMMapper] JSON parse failed: "${raw.slice(0, 100)}"`);
            return { result: null, latency, fallback: true, error: 'parse failed' };
        }
        console.log(`[LLMMapper] ${cfg.provider}/${cfg.model} latency=${latency}ms x=${parsed.x} y=${parsed.y} reason="${parsed.reason}"`);
        return { result: parsed, latency, fallback: false };
    }
    catch (e) {
        console.warn(`[LLMMapper] ${e.name || 'error'}: ${e.message || ''}`);
        return { result: null, latency: Date.now() - start, fallback: true, error: e.name || 'error' };
    }
}
function parseLLMResponse(raw) {
    try {
        let cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '');
        const obj = JSON.parse(cleaned);
        if (typeof obj.x !== 'number' || typeof obj.y !== 'number')
            return null;
        if (obj.x < -1 || obj.x > 1 || obj.y < -1 || obj.y > 1)
            return null;
        return {
            x: Math.round(obj.x * 1000) / 1000,
            y: Math.round(obj.y * 1000) / 1000,
            isEntertainment: !!obj.isEntertainment,
            durationLevel: 'medium',
            reason: String(obj.reason || '').slice(0, 80),
        };
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=llm-coordinate-mapper.js.map