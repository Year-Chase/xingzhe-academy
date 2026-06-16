"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpeechService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function cleanTranscribeText(raw) {
    if (!raw)
        return '';
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed
                .map((seg) => seg.VoiceTextStr || seg.text || seg.sentence || '')
                .join('')
                .trim();
        }
        if (parsed.SentenceList) {
            return parsed.SentenceList
                .map((s) => s.VoiceTextStr || s.text || '')
                .join('')
                .trim();
        }
        if (typeof parsed.Result === 'string')
            return parsed.Result.trim();
        if (typeof parsed.ResultStr === 'string')
            return parsed.ResultStr.trim();
        if (typeof parsed === 'string')
            return parsed.trim();
    }
    catch {
    }
    let cleaned = raw.replace(/\[\s*[\d:.]+[\s,]+[\d:.]+\s*\]\s*/g, '');
    cleaned = cleaned.replace(/^\d+\.\d+\s*$/gm, '');
    cleaned = cleaned.replace(/\n{2,}/g, '\n').trim();
    return cleaned;
}
let SpeechService = class SpeechService {
    constructor(config) {
        this.config = config;
        this.asrClient = null;
        this.configured = false;
        const secretId = this.config.get('TENCENT_SECRET_ID');
        const secretKey = this.config.get('TENCENT_SECRET_KEY');
        if (secretId && secretKey) {
            try {
                const tencentcloud = require('tencentcloud-sdk-nodejs-asr');
                const AsrClient = tencentcloud.asr.v20190614.Client;
                this.asrClient = new AsrClient({
                    credential: { secretId, secretKey },
                    region: this.config.get('TENCENT_ASR_REGION', 'ap-shanghai'),
                });
                this.configured = true;
            }
            catch (e) {
                console.warn('[SpeechService] 腾讯云 ASR SDK 未安装或初始化失败:', e.message);
            }
        }
        else {
            console.warn('[SpeechService] 未配置 TENCENT_SECRET_ID / TENCENT_SECRET_KEY');
        }
    }
    async createTask(audioUrl) {
        if (!this.configured || !this.asrClient) {
            throw new Error('腾讯云 ASR 未配置。请在 .env 中设置 TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY。');
        }
        const filename = path.basename(audioUrl);
        const filePath = path.join(process.cwd(), 'uploads', 'audio', filename);
        if (!fs.existsSync(filePath)) {
            throw new Error(`音频文件不存在: ${filePath}`);
        }
        const buffer = fs.readFileSync(filePath);
        const stats = fs.statSync(filePath);
        console.log(`[SpeechService] 音频文件: ${filePath}`);
        console.log(`[SpeechService] 文件大小: ${stats.size} bytes, 修改时间: ${stats.mtime.toISOString()}`);
        console.log(`[SpeechService] 可播放验证: open ${filePath}`);
        if (stats.size < 1024) {
            throw new Error(`音频文件过小 (${stats.size} bytes)，可能为静音或录音失败。请重新录音。`);
        }
        const base64Data = buffer.toString('base64');
        const engineModelType = this.config.get('TENCENT_ASR_ENGINE_MODEL_TYPE', '16k_zh');
        const params = {
            EngineModelType: engineModelType,
            ChannelNum: 1,
            ResTextFormat: 0,
            SourceType: 1,
            Data: base64Data,
            DataLen: buffer.length,
        };
        console.log('[SpeechService] CreateRecTask 参数:', JSON.stringify({ ...params, Data: `[base64, ${buffer.length} bytes]` }));
        const result = await this.asrClient.CreateRecTask(params);
        if (!result.Data?.TaskId) {
            console.error('[SpeechService] CreateRecTask 返回异常:', JSON.stringify(result));
            throw new Error('创建识别任务失败：未获取到 TaskId');
        }
        console.log(`[SpeechService] ✅ ASR 任务创建成功 — TaskId=${result.Data.TaskId}`);
        return { taskId: result.Data.TaskId };
    }
    async queryTask(taskId) {
        if (!this.configured || !this.asrClient) {
            throw new Error('腾讯云 ASR 未配置');
        }
        const result = await this.asrClient.DescribeTaskStatus({
            TaskId: taskId,
        });
        const topKeys = Object.keys(result);
        console.log('[SpeechService] DescribeTaskStatus 顶层 keys:', topKeys);
        console.log('[SpeechService] DescribeTaskStatus 原始返回:', JSON.stringify(result, null, 2));
        const data = result.Data || {};
        const status = data.Status ?? result.Status ?? -1;
        const rawText = data.ResultStr ||
            data.Result ||
            result.ResultStr ||
            result.Result ||
            '';
        const text = cleanTranscribeText(rawText);
        const statusLabels = { 0: 'waiting', 1: 'doing', 2: 'success', 3: 'failed' };
        const label = statusLabels[status] || `unknown(${status})`;
        if (rawText !== text) {
            console.log(`[SpeechService] 文本清洗 — 原始(${rawText.length}字): "${rawText.slice(0, 100)}"`);
            console.log(`[SpeechService] 文本清洗 — 结果(${text.length}字): "${text.slice(0, 100)}"`);
        }
        if (status === 2 && !text) {
            console.warn(`[SpeechService] ⚠️ status=2(success) 但文本为空`);
            console.warn(`[SpeechService] Data keys:`, Object.keys(data));
            console.warn(`[SpeechService] Full Data:`, JSON.stringify(data));
            console.warn(`[SpeechService] Full result:`, JSON.stringify(result));
        }
        console.log(`[SpeechService] ASR status=${status}(${label}), text="${text.slice(0, 80)}"`);
        return {
            status,
            text,
            errorMsg: data.ErrorMsg || result.ErrorMsg || '',
        };
    }
};
exports.SpeechService = SpeechService;
exports.SpeechService = SpeechService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SpeechService);
//# sourceMappingURL=speech.service.js.map