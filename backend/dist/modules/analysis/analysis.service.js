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
exports.AnalysisService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const config_1 = require("@nestjs/config");
const state_analysis_entity_1 = require("./entities/state-analysis.entity");
const diary_entry_entity_1 = require("../diary/entities/diary-entry.entity");
const task_response_entity_1 = require("./entities/task-response.entity");
const state_feedback_entity_1 = require("./entities/state-feedback.entity");
const text_coordinate_mapper_1 = require("./text-coordinate-mapper");
const state_classifier_1 = require("./state-classifier");
const score_adjuster_1 = require("./score-adjuster");
const llm_coordinate_mapper_1 = require("./llm-coordinate-mapper");
const llm_mapper_config_1 = require("../../config/llm-mapper.config");
let AnalysisService = class AnalysisService {
    constructor(analysisRepo, diaryRepo, taskResponseRepo, feedbackRepo, config) {
        this.analysisRepo = analysisRepo;
        this.diaryRepo = diaryRepo;
        this.taskResponseRepo = taskResponseRepo;
        this.feedbackRepo = feedbackRepo;
        this.config = config;
        const llmCfg = (0, llm_mapper_config_1.getLLMConfig)();
        console.log(`[LLM CONFIG] enabled=${llmCfg.enabled} provider=${llmCfg.provider} model=${llmCfg.model} hasKey=${!!llmCfg.apiKey}`);
    }
    async analyze(userId, diaryId) {
        const diary = await this.diaryRepo.findOne({ where: { id: diaryId } });
        if (!diary)
            throw new Error('日记不存在');
        const provider = this.config.get('AI_PROVIDER', 'mock');
        const content = diary.content || '';
        const ruleCoord = (0, text_coordinate_mapper_1.textToCoordinate)(content);
        const { posHit, negHit, highHit, lowHit } = ruleCoord;
        const ruleX = ruleCoord.x, ruleY = ruleCoord.y;
        const ruleCls = (0, state_classifier_1.classifyState)(ruleX, ruleY, false);
        const ruleScores = (0, score_adjuster_1.computeScores)(ruleX, ruleY);
        const now = new Date();
        const localHour = now.getHours();
        const isNight = localHour >= 23 || localHour < 5;
        let x = ruleX, y = ruleY;
        let stateCode = ruleCls.stateCode, stateName = ruleCls.stateName;
        let mapperType = 'rule', mapperProvider = '', mapperModel = '';
        let llmShadow = null;
        const llmConfig = (0, llm_mapper_config_1.getLLMConfig)();
        if (llmConfig.enabled) {
            console.log(`[LLM Shadow] start content="${content.slice(0, 60)}"`);
            try {
                const llm = await Promise.race([
                    (0, llm_coordinate_mapper_1.llmToCoordinate)(content, { localHour, isNight }),
                    new Promise(r => setTimeout(() => r({ result: null, latency: 0, fallback: true, error: 'timeout' }), 3000)),
                ]);
                if (llm.result && !llm.fallback) {
                    const llmCls = (0, state_classifier_1.classifyState)(llm.result.x, llm.result.y, llm.result.isEntertainment);
                    x = llm.result.x;
                    y = llm.result.y;
                    stateCode = llmCls.stateCode;
                    stateName = llmCls.stateName;
                    mapperType = 'llm';
                    mapperProvider = llmConfig.provider;
                    mapperModel = llmConfig.model;
                    console.log(`[LLM Primary] ✅ stateCode=${stateCode} vs rule=${ruleCls.stateCode}`);
                }
                else {
                    console.log(`[LLM Primary] fallback → rule stateCode=${ruleCls.stateCode}`);
                }
                llmShadow = {
                    ruleX, ruleY, ruleStateCode: ruleCls.stateCode,
                    llmX: llm.result?.x, llmY: llm.result?.y,
                    llmStateCode: llm.result ? (0, state_classifier_1.classifyState)(llm.result.x, llm.result.y, llm.result.isEntertainment).stateCode : null,
                    llmReason: llm.result?.reason,
                    provider: llmConfig.provider, model: llmConfig.model,
                    latency: llm.latency, fallback: llm.fallback,
                };
            }
            catch {
                console.log(`[LLM Primary] error → fallback`);
            }
        }
        const { scoreStress, scoreEmotion, scoreComposite } = (0, score_adjuster_1.computeScores)(x, y);
        console.log(JSON.stringify({
            event: '[StateEngine]',
            content: content.slice(0, 100),
            mapper: mapperType,
            posHit, negHit, highHit, lowHit,
            x, y, stateCode, stateName,
            scoreStress, scoreEmotion, scoreComposite,
        }));
        const tensionScore = scoreStress / 10;
        const eV = Math.round(x * 5 * 10) / 10;
        const rL = scoreEmotion >= 60 ? 7.0 : scoreEmotion >= 40 ? 5.0 : 2.0;
        const dL = Math.abs(y) > 0.5 ? 7.0 : 4.0;
        const hitWords = extractHitWords(content, x, y);
        const summary = genSummary(stateName, scoreComposite);
        const evidence = genEvidence(x, y, hitWords);
        const suggestion = genSuggestion(stateCode);
        const analysis = this.analysisRepo.create({
            id: (0, uuid_1.v4)(),
            userId, diaryId, sourceType: 'diary',
            tensionScore, emotionValence: eV, recoveryLevel: rL, durationLevel: dL,
            stateType: stateCode, stateLabel: stateName, summary, evidence, suggestion,
            confidence: 0.85,
            xValue: Math.round(x * 1000) / 1000,
            yValue: Math.round(y * 1000) / 1000,
            scoreStress, scoreEmotion, scoreComposite,
            engineVersion: 'v1',
            mapperType, mapperProvider, mapperModel,
            rawResponse: { engine: 'v1', provider: mapperType === 'llm' ? mapperProvider : 'rule', x, y, words: hitWords, shadow: llmShadow },
            aiProvider: mapperType === 'llm' ? mapperProvider : provider, aiModel: mapperType === 'llm' ? `llm-${mapperModel}` : 'state-engine-v1',
        });
        await this.analysisRepo.save(analysis);
        console.log(`[StateEngine] saved analysisId=${analysis.id} stateCode=${stateCode} mapper=${mapperType} x=${x.toFixed(3)} y=${y.toFixed(3)}`);
        return analysis;
    }
    async getTrend(userId, days = 7) {
        const rows = await this.analysisRepo.manager.query(`SELECT
        d.diary_date as date,
        AVG(sa.tension_score * 10) as avg_tension,
        COUNT(*) as record_count,
        SUM(CASE WHEN sa.emotion_valence <= -1.5 THEN 1 ELSE 0 END) as neg_count,
        SUM(CASE WHEN sa.emotion_valence >= 1.5 THEN 1 ELSE 0 END) as pos_count,
        SUM(CASE WHEN sa.emotion_valence > -1.5 AND sa.emotion_valence < 1.5 THEN 1 ELSE 0 END) as neu_count
      FROM diary_entries d
      JOIN state_analyses sa ON sa.diary_id = d.id
      WHERE d.user_id = ?
        AND d.diary_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY d.diary_date
      ORDER BY d.diary_date DESC`, [userId, days]);
        for (const row of rows) {
            const topState = await this.analysisRepo.manager.query(`SELECT sa.state_type, sa.state_label FROM state_analyses sa
         JOIN diary_entries d ON sa.diary_id = d.id
         WHERE d.user_id = ? AND d.diary_date = ?
         GROUP BY sa.state_type, sa.state_label
         ORDER BY COUNT(*) DESC LIMIT 1`, [userId, row.date]);
            if (topState[0]) {
                row.mainStateCode = topState[0].state_type;
                row.mainStateLabel = topState[0].state_label || '观察中';
            }
        }
        const totalRecords = rows.reduce((s, r) => s + Number(r.record_count), 0);
        const avgTension = rows.length
            ? Math.round(rows.reduce((s, r) => s + Number(r.avg_tension), 0) / rows.length)
            : 0;
        return {
            days,
            summary: { totalRecords, avgTensionScore: avgTension },
            items: rows.map((r) => ({
                date: r.date,
                avgTensionScore: Math.round(Number(r.avg_tension)),
                recordCount: Number(r.record_count),
                mainStateCode: r.mainStateCode || 'neutral_observation',
                mainStateLabel: r.mainStateLabel || '观察中',
                emotionDistribution: {
                    negative: Number(r.neg_count),
                    neutral: Number(r.neu_count),
                    positive: Number(r.pos_count),
                },
            })),
        };
    }
    async getContinuity(userId) {
        console.log('[Continuity] userId:', userId);
        try {
            const dateRows = await this.analysisRepo.manager.query(`SELECT diary_date FROM diary_entries WHERE user_id = ? AND diary_date IS NOT NULL GROUP BY diary_date ORDER BY diary_date DESC`, [userId]);
            console.log('[Continuity] diary dates count:', dateRows.length);
            const dates = dateRows.map((r) => {
                try {
                    const d = r.diary_date instanceof Date ? r.diary_date : new Date(r.diary_date);
                    return d.toISOString().slice(0, 10);
                }
                catch {
                    return String(r.diary_date || '').slice(0, 10);
                }
            }).filter(Boolean);
            const counts = await this.analysisRepo.manager.query(`SELECT COUNT(*) as total, COUNT(DISTINCT diary_date) as days,
          COALESCE(SUM(CASE WHEN content_type='voice' THEN 1 ELSE 0 END), 0) as voice_cnt,
          COALESCE(SUM(CASE WHEN content_type='text' THEN 1 ELSE 0 END), 0) as text_cnt
         FROM diary_entries WHERE user_id = ?`, [userId]);
            const c = counts[0] || {};
            console.log('[Continuity] counts:', JSON.stringify(c));
            let currentStreak = 0;
            let longestStreak = 0;
            if (dates.length > 0) {
                const today = new Date().toISOString().slice(0, 10);
                let streak = 0;
                let prevDate = today;
                for (const d of dates) {
                    const prev = new Date(prevDate);
                    const curr = new Date(d);
                    if (isNaN(curr.getTime()))
                        continue;
                    const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
                    if (diff <= 1) {
                        streak++;
                        prevDate = d;
                    }
                    else {
                        break;
                    }
                }
                currentStreak = streak;
                let maxStreak = 1;
                let run = 1;
                for (let i = 1; i < dates.length; i++) {
                    const prevD = new Date(dates[i - 1]);
                    const currD = new Date(dates[i]);
                    if (isNaN(prevD.getTime()) || isNaN(currD.getTime()))
                        continue;
                    const diffD = Math.round((prevD.getTime() - currD.getTime()) / 86400000);
                    if (diffD === 1) {
                        run++;
                        maxStreak = Math.max(maxStreak, run);
                    }
                    else {
                        run = 1;
                    }
                }
                longestStreak = dates.length > 0 ? maxStreak : 0;
            }
            console.log('[Continuity] streak:', currentStreak, 'longest:', longestStreak);
            const lastTwo = await this.analysisRepo.manager.query(`SELECT tension_score, state_type, state_label FROM state_analyses
         WHERE user_id = ? ORDER BY created_at DESC LIMIT 2`, [userId]);
            console.log('[Continuity] lastTwo analyses count:', lastTwo.length);
            let delta = null;
            if (lastTwo.length === 2) {
                const latestT = Math.round(Number(lastTwo[0].tension_score || 0) * 10);
                const prevT = Math.round(Number(lastTwo[1].tension_score || 0) * 10);
                const diff = latestT - prevT;
                delta = {
                    tension: latestT,
                    previousTension: prevT,
                    delta: diff,
                    direction: Math.abs(diff) < 3 ? 'flat' : diff > 0 ? 'up' : 'down',
                };
                console.log('[Continuity] delta:', JSON.stringify(delta));
            }
            const timelineRows = await this.analysisRepo.manager.query(`SELECT d.diary_date, sa.state_label FROM diary_entries d
         JOIN state_analyses sa ON sa.diary_id = d.id
         WHERE d.user_id = ?
         ORDER BY d.diary_date DESC, sa.created_at DESC
         LIMIT 3`, [userId]);
            console.log('[Continuity] timeline rows:', timelineRows.length);
            const timeline = timelineRows.map((r) => {
                let dateStr = '';
                try {
                    dateStr = r.diary_date instanceof Date ? r.diary_date.toISOString().slice(0, 10) : String(r.diary_date || '').slice(0, 10);
                }
                catch {
                    dateStr = '';
                }
                return {
                    date: dateStr,
                    stateLabel: r.state_label || '观察中',
                };
            });
            return {
                currentStreak,
                longestStreak,
                totalDays: Number(c.days || 0),
                totalRecords: Number(c.total || 0),
                voiceCount: Number(c.voice_cnt || 0),
                textCount: Number(c.text_cnt || 0),
                latestDelta: delta,
                timeline,
            };
        }
        catch (e) {
            console.error('[Continuity] 查询失败:', e.message, e.stack);
            return {
                currentStreak: 0,
                longestStreak: 0,
                totalDays: 0,
                totalRecords: 0,
                voiceCount: 0,
                textCount: 0,
                latestDelta: null,
                timeline: [],
            };
        }
    }
    async getReview(userId, days = 7) {
        const rows = await this.analysisRepo.manager.query(`SELECT sa.tension_score, sa.emotion_valence, sa.recovery_level,
        sa.state_type, sa.state_label, sa.summary, d.content
       FROM state_analyses sa
       JOIN diary_entries d ON sa.diary_id = d.id
       WHERE d.user_id = ? AND d.diary_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       ORDER BY sa.created_at DESC`, [userId, days]);
        const diaryCounts = await this.analysisRepo.manager.query(`SELECT COUNT(*) as total, COUNT(DISTINCT diary_date) as days
       FROM diary_entries WHERE user_id = ?
       AND diary_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`, [userId, days]);
        const dc = diaryCounts[0] || {};
        if (rows.length === 0) {
            return {
                days, summary: { recordCount: 0, recordDays: 0, currentStreak: 0 },
                states: [], tension: { avg: 0, max: 0, min: 0, latest: 0 },
                emotion: { positive: 0, neutral: 0, negative: 0 },
                recovery: { high: 0, medium: 0, low: 0 },
                highlights: [], reviewSummary: '这段时间还没有足够记录，先完成一次状态记录。',
            };
        }
        const stateMap = {};
        for (const r of rows) {
            const code = r.state_type || 'neutral_observation';
            if (!stateMap[code])
                stateMap[code] = { code, label: r.state_label || '状态观察中', count: 0 };
            stateMap[code].count++;
        }
        const states = Object.values(stateMap).sort((a, b) => b.count - a.count);
        const tensions = rows.map((r) => Math.round(Number(r.tension_score || 0) * 10));
        const avgT = Math.round(tensions.reduce((s, v) => s + v, 0) / tensions.length);
        const maxT = Math.max(...tensions);
        const minT = Math.min(...tensions);
        let pos = 0, neu = 0, neg = 0;
        for (const r of rows) {
            const v = Number(r.emotion_valence || 0);
            if (v >= 1.5)
                pos++;
            else if (v <= -1.5)
                neg++;
            else
                neu++;
        }
        let h = 0, m = 0, l = 0;
        for (const r of rows) {
            const v = Number(r.recovery_level || 0);
            if (v >= 7)
                h++;
            else if (v <= 3)
                l++;
            else
                m++;
        }
        const seen = new Set();
        const highlights = [];
        for (const r of rows) {
            const s = (r.summary || '').trim();
            if (s && !seen.has(s)) {
                seen.add(s);
                highlights.push(s);
            }
            if (highlights.length >= 5)
                break;
        }
        const stressKeywords = {
            '工作': '工作', '项目': '工作', '任务': '工作', '客户': '客户', '老板': '工作',
            '加班': '工作', '进度': '工作', '交付': '工作', '开会': '工作', '报告': '工作',
            '未完成': '未完成事项', '拖延': '未完成事项', '还没': '未完成事项',
            '焦虑': '情绪焦虑', '紧张': '情绪焦虑', '压力': '压力', '崩溃': '压力',
        };
        const recoveryKeywords = {
            '跑步': '跑步', '散步': '散步', '运动': '运动', '健身': '运动',
            '冥想': '冥想', '呼吸': '呼吸练习', '478': '呼吸练习', '放松': '放松',
            '睡': '睡眠', '休息': '休息', '音乐': '音乐', '读书': '阅读',
            '游戏': '游戏娱乐', '抖音': '游戏娱乐', '刷': '游戏娱乐',
        };
        const stressCount = {};
        const recoveryCount = {};
        for (const r of rows) {
            const text = (r.content || '').toLowerCase();
            for (const [kw, cat] of Object.entries(stressKeywords)) {
                if (text.includes(kw))
                    stressCount[cat] = (stressCount[cat] || 0) + 1;
            }
            for (const [kw, cat] of Object.entries(recoveryKeywords)) {
                if (text.includes(kw))
                    recoveryCount[cat] = (recoveryCount[cat] || 0) + 1;
            }
        }
        const topStress = Object.entries(stressCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
        const topRecovery = Object.entries(recoveryCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
        const dayStateMap = new Map();
        for (const r of rows) {
            const code = r.state_type || 'neutral';
            const label = r.state_label || '观察中';
            dayStateMap.set(label, (dayStateMap.get(label) || 0) + 1);
        }
        const stateDistribution = [...dayStateMap.entries()]
            .map(([state, cnt]) => ({ state, days: cnt }))
            .sort((a, b) => b.days - a.days);
        const dominantState = states[0]?.label || '观察中';
        const mainStateCode = states[0]?.code || 'ST_CALM';
        const recoverRatioH = rows.length > 0 ? Math.round((h / rows.length) * 100) : 0;
        const recoverPhrase = recoverRatioH <= 20 ? '恢复行为偏少' : '恢复与压力基本平衡';
        const stressPhrase = topStress.length > 0 ? `压力主要来自${topStress.slice(0, 2).join('与')}` : '';
        const recoveryPhrase2 = topRecovery.length > 0 ? `恢复行为主要依赖${topRecovery.slice(0, 2).join('与')}` : '';
        const reviewSummary = `最近${days >= 90 ? '三个月' : days >= 30 ? '一个月' : '一周'}整体呈现${dominantState}状态，${stressPhrase}，${recoveryPhrase2}，${recoverPhrase}。`;
        return {
            days,
            summary: { recordCount: Number(dc.total || 0), recordDays: Number(dc.days || 0), currentStreak: 0 },
            dominantState, dominantStateCode: mainStateCode,
            stateDistribution, states,
            tension: { avg: avgT, max: maxT, min: minT, latest: tensions[0] },
            emotion: { positive: pos, neutral: neu, negative: neg },
            recovery: { high: h, medium: m, low: l },
            mainStressFactors: topStress, mainRecoveryFactors: topRecovery,
            highlights, reviewSummary,
        };
    }
    async submitTaskResponse(userId, analysisId, taskCode, value) {
        await this.taskResponseRepo.delete({ analysisId, taskCode, userId });
        const tr = new task_response_entity_1.TaskResponse();
        tr.id = (0, uuid_1.v4)();
        tr.analysisId = analysisId;
        tr.taskCode = taskCode;
        tr.userId = userId;
        tr.taskValue = value === null || value === undefined ? null : String(value);
        return await this.taskResponseRepo.save(tr);
    }
    async submitFeedback(userId, analysisId, feedbackScore, correctedState) {
        const analysis = await this.analysisRepo.findOne({ where: { id: analysisId } });
        await this.feedbackRepo.delete({ analysisId, userId });
        const fb = new state_feedback_entity_1.StateFeedback();
        fb.id = (0, uuid_1.v4)();
        fb.analysisId = analysisId;
        fb.userId = userId;
        fb.predictedState = analysis?.stateType || 'unknown';
        fb.feedbackScore = feedbackScore;
        fb.correctedState = feedbackScore <= 2 ? correctedState : null;
        return this.feedbackRepo.save(fb);
    }
    async getTrajectory(userId) {
        const rows = await this.analysisRepo.manager.query(`SELECT d.diary_date, sa.state_type, sa.state_label, sa.score_stress, sa.score_emotion
       FROM state_analyses sa
       JOIN diary_entries d ON sa.diary_id = d.id
       WHERE d.user_id = ? AND d.diary_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       ORDER BY d.diary_date ASC`, [userId]);
        if (rows.length < 3) {
            return { currentTrajectory: '记录不足', riskLevel: 'low', fromState: null, toState: null, days: 0, confidence: 0 };
        }
        const dayMap = new Map();
        for (const r of rows) {
            const d = r.diary_date instanceof Date ? r.diary_date.toISOString().slice(0, 10) : String(r.diary_date).slice(0, 10);
            if (!dayMap.has(d))
                dayMap.set(d, r.state_type);
        }
        const states = [...dayMap.values()];
        const mid = Math.floor(states.length / 2);
        const recent = states.slice(mid);
        const earlier = states.slice(0, mid);
        const stressLevel = (code) => {
            if (code === 'ST_EXHAUSTION')
                return 4;
            if (code === 'ST_NEGATIVE_STRESS')
                return 3;
            if (code === 'ST_POSITIVE_STRESS')
                return 2;
            if (code === 'ST_PASSIVE_RELAXATION')
                return 1;
            if (code === 'ST_TRUE_RELAXATION')
                return 0;
            return 1;
        };
        const avgRecent = recent.reduce((s, c) => s + stressLevel(c), 0) / recent.length;
        const avgEarlier = earlier.reduce((s, c) => s + stressLevel(c), 0) / earlier.length;
        const diff = avgRecent - avgEarlier;
        let trajectory = '状态平稳';
        let riskLevel = 'low';
        let fromState = states[0];
        let toState = states[states.length - 1];
        if (diff > 1.5) {
            trajectory = '状态持续下滑';
            riskLevel = 'high';
        }
        else if (diff > 0.5) {
            trajectory = '状态轻微下滑';
            riskLevel = 'medium';
        }
        else if (diff < -1.5) {
            trajectory = '状态明显恢复';
            riskLevel = 'low';
        }
        else if (diff < -0.5) {
            trajectory = '状态轻微改善';
            riskLevel = 'low';
        }
        let streakDays = 1;
        for (let i = states.length - 1; i > 0; i--) {
            if (states[i] === states[i - 1])
                streakDays++;
            else
                break;
        }
        return {
            currentTrajectory: trajectory,
            riskLevel,
            fromState, toState,
            days: streakDays,
            confidence: Math.round(Math.min(1, Math.abs(diff) / 3) * 100) / 100,
        };
    }
    async getCalibration() {
        const rows = await this.feedbackRepo.find();
        const total = rows.length;
        if (total === 0)
            return { totalFeedbacks: 0, accuracyRate: null, confusionMatrix: [] };
        const accurate = rows.filter(r => (r.feedbackScore ?? 0) >= 3).length;
        const accuracyRate = Math.round((accurate / total) * 100) / 100;
        const confusion = {};
        for (const r of rows) {
            if ((r.feedbackScore ?? 0) <= 2 && r.correctedState) {
                if (!confusion[r.predictedState])
                    confusion[r.predictedState] = {};
                confusion[r.predictedState][r.correctedState] = (confusion[r.predictedState][r.correctedState] || 0) + 1;
            }
        }
        const confusionMatrix = Object.entries(confusion).map(([predicted, corrected]) => ({ predicted, corrected }));
        return { totalFeedbacks: total, accuracyRate, confusionMatrix };
    }
    async getTaskResponses(analysisId) {
        const rows = await this.taskResponseRepo.find({ where: { analysisId } });
        return new Map(rows.map(r => [r.taskCode, r.taskValue ?? null]));
    }
    async getDebugLatest(limit = 20) {
        const rows = await this.analysisRepo.find({
            order: { createdAt: 'DESC' }, take: limit,
            relations: ['diary'],
        });
        return rows.map(a => {
            const shadow = a.rawResponse?.shadow || {};
            return {
                id: a.id,
                content: a.diary?.content?.slice(0, 150) || '',
                mapperType: a.mapperType, provider: a.mapperProvider, model: a.mapperModel,
                ruleX: shadow.ruleX, ruleY: shadow.ruleY, ruleStateCode: shadow.ruleStateCode,
                llmX: shadow.llmX, llmY: shadow.llmY, llmStateCode: shadow.llmStateCode,
                llmReason: shadow.llmReason, fallback: shadow.fallback, latency: shadow.latency,
                x: a.xValue, y: a.yValue,
                stateCode: a.stateType, stateName: a.stateLabel,
                scoreStress: a.scoreStress, scoreEmotion: a.scoreEmotion, scoreComposite: a.scoreComposite,
                summary: a.summary, suggestion: a.suggestion,
                createdAt: a.createdAt,
            };
        });
    }
    async getMapperStats() {
        const total = await this.analysisRepo.count();
        const llmCount = await this.analysisRepo.count({ where: { mapperType: 'llm' } });
        const rows = await this.analysisRepo.find({
            where: { mapperType: 'llm' },
            order: { createdAt: 'DESC' }, take: 100,
        });
        const shadowRows = rows.filter(r => r.rawResponse?.shadow);
        const latencies = shadowRows.map(r => r.rawResponse.shadow.latency).filter(Boolean);
        const avgLatency = latencies.length ? Math.round(latencies.reduce((s, v) => s + v, 0) / latencies.length) : 0;
        const fallbackCount = shadowRows.filter(r => r.rawResponse.shadow.fallback).length;
        return {
            total, llmCount, fallbackCount, avgLatencyMs: avgLatency,
            provider: (0, llm_mapper_config_1.getLLMConfig)().provider,
            model: (0, llm_mapper_config_1.getLLMConfig)().model,
        };
    }
    async findById(id) {
        return this.analysisRepo.findOne({ where: { id } });
    }
    async getLatest(userId) {
        return this.analysisRepo.findOne({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }
};
exports.AnalysisService = AnalysisService;
exports.AnalysisService = AnalysisService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(state_analysis_entity_1.StateAnalysis)),
    __param(1, (0, typeorm_1.InjectRepository)(diary_entry_entity_1.DiaryEntry)),
    __param(2, (0, typeorm_1.InjectRepository)(task_response_entity_1.TaskResponse)),
    __param(3, (0, typeorm_1.InjectRepository)(state_feedback_entity_1.StateFeedback)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], AnalysisService);
function extractHitWords(text, _x, _y) {
    const posWords = ['开心', '期待', '成就感', '放松', '好', '顺利', '完成', '推进', '恢复'];
    const negWords = ['焦虑', '烦', '崩溃', '累', '疲惫', '压力', '担心', '紧张'];
    const result = [];
    posWords.forEach(w => { if (text.includes(w))
        result.push(`+${w}`); });
    negWords.forEach(w => { if (text.includes(w))
        result.push(`-${w}`); });
    return result.length > 0 ? result : ['未检测到关键词'];
}
function genSummary(stateName, scoreComposite) {
    const level = scoreComposite >= 70 ? '较高' : scoreComposite >= 40 ? '中等' : '较低';
    return `你当前处于${stateName}，综合压力水平${level}。`;
}
function genEvidence(x, y, words) {
    const e = [];
    if (x < -0.3)
        e.push('文本中存在消极表达');
    if (x > 0.3)
        e.push('文本中存在积极表达');
    if (y > 0.5)
        e.push('表达中有高唤醒特征（忙碌/推进）');
    if (y < -0.5)
        e.push('表达中有低唤醒特征（休息/放空）');
    if (words.length > 0 && words[0] !== '未检测到关键词')
        e.push(`关键词: ${words.join(', ')}`);
    return e.length > 0 ? e : ['基于文本坐标分析'];
}
function genSuggestion(stateCode) {
    const map = {
        ST_CALM: '当前状态平稳，可以继续保持现有节奏。',
        ST_POSITIVE_STRESS: '你处于良性紧张中，适合深度工作。注意每45分钟休息一下。',
        ST_TRUE_RELAXATION: '你正在放松恢复中，趁状态好可以做一些有挑战的事。',
        ST_NEGATIVE_STRESS: '你当前承受较大压力，建议做一次10分钟散步或深呼吸。',
        ST_EXHAUSTION: '你看起来比较疲惫，今天尽量早睡，减少不必要的消耗。',
        ST_PASSIVE_RELAXATION: '当前是休息时间，被动放松也能帮助恢复。如果明天精力允许，可以尝试一段散步。',
    };
    return map[stateCode] || '保持观察，记录你的状态变化。';
}
//# sourceMappingURL=analysis.service.js.map