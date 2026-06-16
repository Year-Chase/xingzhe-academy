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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiaryController = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const uuid_1 = require("uuid");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const diary_service_1 = require("./diary.service");
const create_diary_dto_1 = require("./dto/create-diary.dto");
function detectAudioFormat(header) {
    const h = header;
    if (h[0] === 0x49 && h[1] === 0x44 && h[2] === 0x33)
        return { ext: '.mp3', mime: 'audio/mpeg' };
    if ((h[0] === 0xff && (h[1] & 0xe0) === 0xe0))
        return { ext: '.mp3', mime: 'audio/mpeg' };
    if (h.length >= 12 && h[4] === 0x66 && h[5] === 0x74 && h[6] === 0x79 && h[7] === 0x70) {
        return { ext: '.m4a', mime: 'audio/x-m4a' };
    }
    if ((h[0] === 0xff && (h[1] & 0xf0) === 0xf0))
        return { ext: '.aac', mime: 'audio/aac' };
    if (h[0] === 0x52 && h[1] === 0x49 && h[2] === 0x46 && h[3] === 0x46)
        return { ext: '.wav', mime: 'audio/wav' };
    if (h[0] === 0x1a && h[1] === 0x45 && h[2] === 0xdf && h[3] === 0xa3)
        return null;
    return null;
}
let DiaryController = class DiaryController {
    constructor(diaryService) {
        this.diaryService = diaryService;
    }
    async uploadAudio(file) {
        if (!file) {
            return { code: 10001, message: '未上传文件', data: null };
        }
        console.log('[UploadAudio] === 文件上传诊断 ===');
        console.log('[UploadAudio] originalname:', file.originalname);
        console.log('[UploadAudio] mimetype:', file.mimetype);
        console.log('[UploadAudio] size:', file.size, 'bytes');
        console.log('[UploadAudio] saved to:', file.path);
        if (file.size < 1024) {
            fs.unlinkSync(file.path);
            console.warn('[UploadAudio] 文件过小，已删除');
            return { code: 10001, message: '录音文件过小，请重新录音', data: null };
        }
        let header;
        try {
            header = fs.readFileSync(file.path).slice(0, 64);
        }
        catch {
            return { code: 10001, message: '无法读取上传文件', data: null };
        }
        const hex = header.toString('hex').match(/.{1,2}/g)?.join(' ') || '';
        const ascii = [...header.slice(0, 16)].map(b => b >= 32 && b < 127 ? String.fromCharCode(b) : '.').join('');
        console.log('[UploadAudio] 文件头 hex:', hex);
        console.log('[UploadAudio] 文件头 ascii:', ascii);
        const fmt = detectAudioFormat(header);
        if (!fmt) {
            console.warn('[UploadAudio] ❌ 不支持的音频格式');
            const isWebM = header[0] === 0x1a && header[1] === 0x45 && header[2] === 0xdf && header[3] === 0xa3;
            if (isWebM) {
                console.warn('[UploadAudio] 确认为 WebM — 请在真机上测试，模拟器不支持录音格式验证');
            }
            const fmtName = isWebM ? 'WebM' : '未知';
            fs.unlinkSync(file.path);
            return {
                code: 10001,
                message: `录音格式不支持（${fmtName}）。支持的格式：M4A、MP3、AAC、WAV。${isWebM ? '请用真机测试。' : ''}`,
                data: null,
            };
        }
        console.log(`[UploadAudio] ✅ 检测到格式: ${fmt.ext} (${fmt.mime})`);
        const newFilename = file.filename.replace(/\.tmp$/, fmt.ext);
        const newPath = file.path.replace(/\.tmp$/, fmt.ext);
        fs.renameSync(file.path, newPath);
        const audioUrl = `/uploads/audio/${newFilename}`;
        return {
            code: 0,
            message: 'success',
            data: {
                audioUrl,
                fileSize: file.size,
                originalName: file.originalname,
            },
        };
    }
    async create(userId, dto) {
        const diary = await this.diaryService.create(userId, dto);
        return {
            code: 0,
            message: 'success',
            data: {
                id: diary.id,
                content: diary.content,
                contentType: diary.contentType,
                audioUrl: diary.audioUrl,
                audioDuration: diary.audioDuration,
                moodTag: diary.moodTag,
                diaryDate: diary.diaryDate,
                createdAt: diary.createdAt,
            },
        };
    }
    async list(userId, page, pageSize) {
        const result = await this.diaryService.findByUser(userId, page || 1, pageSize || 20);
        return {
            code: 0,
            message: 'success',
            data: {
                list: result.list.map((d) => this.formatDiaryListItem(d)),
                pagination: result.pagination,
            },
        };
    }
    async detail(id) {
        const diary = await this.diaryService.findById(id);
        if (!diary) {
            return { code: 10002, message: '日记不存在', data: null };
        }
        return { code: 0, message: 'success', data: this.formatDiaryDetail(diary) };
    }
    formatDiaryListItem(d) {
        const a = d.analysis;
        return {
            id: d.id,
            content: d.content?.slice(0, 80) || '',
            contentType: d.contentType,
            hasVoice: !!d.audioUrl,
            diaryDate: d.diaryDate,
            createdAt: d.createdAt,
            analysis: a ? {
                stateCode: a.state_type,
                stateLabel: a.state_label || '观察中',
                summary: a.summary || '',
                tensionScore: Math.round((a.tension_score || 0) * 10),
            } : null,
        };
    }
    formatDiaryDetail(d) {
        const a = d.analysis;
        return {
            id: d.id,
            content: d.content,
            contentType: d.contentType,
            audioUrl: d.audioUrl || null,
            hasVoice: !!d.audioUrl,
            diaryDate: d.diaryDate,
            createdAt: d.createdAt,
            analysis: a ? {
                id: a.id,
                tensionScore: Math.round((a.tension_score || 0) * 10),
                emotion: this.valenceToEmotion(a.emotion_valence),
                recoveryLevel: this.numToRecovery(a.recovery_level),
                durationLevel: this.numToDuration(a.duration_level),
                stateCode: a.state_type,
                stateLabel: a.state_label || '观察中',
                summary: a.summary || '',
                evidence: Array.isArray(a.evidence) ? a.evidence : [],
                suggestion: a.suggestion || '',
                confidence: a.confidence || 0,
                createdAt: a.created_at,
            } : null,
        };
    }
    valenceToEmotion(v) {
        if (v == null)
            return 'neutral';
        if (v > 1.5)
            return 'positive';
        if (v < -1.5)
            return 'negative';
        return 'neutral';
    }
    numToRecovery(r) {
        if (r == null)
            return 'medium';
        if (r >= 7)
            return 'high';
        if (r <= 3)
            return 'low';
        return 'medium';
    }
    numToDuration(d) {
        if (d == null)
            return 'medium';
        if (d >= 7)
            return 'long';
        if (d <= 3)
            return 'short';
        return 'medium';
    }
};
exports.DiaryController = DiaryController;
__decorate([
    (0, common_1.Post)('upload-audio'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: path.join(__dirname, '..', '..', '..', 'uploads', 'audio'),
            filename: (_req, _file, cb) => {
                cb(null, (0, uuid_1.v4)() + '.tmp');
            },
        }),
        limits: { fileSize: 10 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DiaryController.prototype, "uploadAudio", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_diary_dto_1.CreateDiaryDto]),
    __metadata("design:returntype", Promise)
], DiaryController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], DiaryController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DiaryController.prototype, "detail", null);
exports.DiaryController = DiaryController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('diary'),
    __metadata("design:paramtypes", [diary_service_1.DiaryService])
], DiaryController);
//# sourceMappingURL=diary.controller.js.map