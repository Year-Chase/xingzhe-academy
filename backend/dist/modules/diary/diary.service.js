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
exports.DiaryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const diary_entry_entity_1 = require("./entities/diary-entry.entity");
const user_entity_1 = require("../users/entities/user.entity");
let DiaryService = class DiaryService {
    constructor(diaryRepo, userRepo) {
        this.diaryRepo = diaryRepo;
        this.userRepo = userRepo;
    }
    async create(userId, dto) {
        const diary = this.diaryRepo.create({
            id: (0, uuid_1.v4)(),
            userId,
            content: dto.content,
            contentType: dto.contentType || 'text',
            audioUrl: dto.audioUrl ?? undefined,
            audioDuration: dto.audioDuration ?? undefined,
            transcriptText: dto.transcriptText ?? undefined,
            transcriptStatus: dto.transcriptStatus ?? undefined,
            wordCount: dto.content.length,
            moodTag: dto.moodTag ?? undefined,
            diaryDate: dto.diaryDate ? new Date(dto.diaryDate) : new Date(),
        });
        const saved = await this.diaryRepo.save(diary);
        const distinctDays = await this.diaryRepo
            .createQueryBuilder('d')
            .select('COUNT(DISTINCT d.diary_date)', 'count')
            .where('d.user_id = :userId', { userId })
            .getRawOne();
        await this.userRepo.update(userId, {
            totalDiaryDays: Number(distinctDays?.count || 0),
        });
        return saved;
    }
    async findByUser(userId, page = 1, pageSize = 20) {
        const [list, total] = await this.diaryRepo.findAndCount({
            where: { userId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        const diaryIds = list.map((d) => d.id);
        const analyses = diaryIds.length
            ? await this.diaryRepo.manager.query(`SELECT sa.* FROM state_analyses sa
           INNER JOIN (
             SELECT diary_id, MAX(created_at) as max_created
             FROM state_analyses
             WHERE diary_id IN (?)
             GROUP BY diary_id
           ) latest ON sa.diary_id = latest.diary_id AND sa.created_at = latest.max_created`, [diaryIds])
            : [];
        const analysisMap = new Map(analyses.map((a) => [a.diary_id, a]));
        return {
            list: list.map((d) => ({
                ...d,
                analysis: analysisMap.get(d.id) || null,
            })),
            pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
        };
    }
    async findById(id) {
        const diary = await this.diaryRepo.findOne({ where: { id } });
        if (!diary)
            return null;
        const analyses = await this.diaryRepo.manager.query(`SELECT * FROM state_analyses WHERE diary_id = ? ORDER BY created_at DESC LIMIT 1`, [id]);
        return { ...diary, analysis: analyses[0] || null };
    }
};
exports.DiaryService = DiaryService;
exports.DiaryService = DiaryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(diary_entry_entity_1.DiaryEntry)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], DiaryService);
//# sourceMappingURL=diary.service.js.map