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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InviteRecord = void 0;
const typeorm_1 = require("typeorm");
let InviteRecord = class InviteRecord {
};
exports.InviteRecord = InviteRecord;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], InviteRecord.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'inviter_user_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], InviteRecord.prototype, "inviterUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invitee_user_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], InviteRecord.prototype, "inviteeUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invite_code', type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], InviteRecord.prototype, "inviteCode", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], InviteRecord.prototype, "createdAt", void 0);
exports.InviteRecord = InviteRecord = __decorate([
    (0, typeorm_1.Entity)('invite_records')
], InviteRecord);
//# sourceMappingURL=invite-record.entity.js.map