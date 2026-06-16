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
exports.CertificateService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const activity_certificate_entity_1 = require("./entities/activity-certificate.entity");
const activity_entity_1 = require("./entities/activity.entity");
function genCertNo(activityId) {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const shortId = activityId.slice(0, 4).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
    return `CERT-${date}-${shortId}-${rand}`;
}
let CertificateService = class CertificateService {
    constructor(certRepo, actRepo) {
        this.certRepo = certRepo;
        this.actRepo = actRepo;
    }
    async generateAfterCheckin(activityId, userId) {
        const existingCert = await this.certRepo.findOne({ where: { activityId, userId } });
        if (existingCert) {
            return { id: existingCert.id, type: existingCert.certificateType, certificateNo: existingCert.certificateNo, note: 'already exists' };
        }
        const activity = await this.actRepo.findOne({ where: { id: activityId } });
        const isSpeaker = activity?.speakerId === userId;
        const cert = new activity_certificate_entity_1.ActivityCertificate();
        cert.id = (0, uuid_1.v4)();
        cert.userId = userId;
        cert.activityId = activityId;
        cert.certificateNo = genCertNo(activityId);
        cert.certificateType = isSpeaker ? 'SPEAKER' : 'WALKER';
        cert.status = 'GENERATED';
        cert.downloadCount = 0;
        await this.certRepo.save(cert);
        return { id: cert.id, type: cert.certificateType, certificateNo: cert.certificateNo };
    }
};
exports.CertificateService = CertificateService;
exports.CertificateService = CertificateService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(activity_certificate_entity_1.ActivityCertificate)),
    __param(1, (0, typeorm_1.InjectRepository)(activity_entity_1.Activity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], CertificateService);
//# sourceMappingURL=certificate.service.js.map