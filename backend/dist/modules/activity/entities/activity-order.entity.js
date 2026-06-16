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
exports.ActivityOrder = void 0;
const typeorm_1 = require("typeorm");
let ActivityOrder = class ActivityOrder {
};
exports.ActivityOrder = ActivityOrder;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], ActivityOrder.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'order_no', type: 'varchar', length: 32, unique: true }),
    __metadata("design:type", String)
], ActivityOrder.prototype, "orderNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], ActivityOrder.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'activity_id', type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], ActivityOrder.prototype, "activityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], ActivityOrder.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, default: 'PENDING' }),
    __metadata("design:type", String)
], ActivityOrder.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pay_time', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], ActivityOrder.prototype, "payTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'refund_time', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], ActivityOrder.prototype, "refundTime", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ActivityOrder.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ActivityOrder.prototype, "updatedAt", void 0);
exports.ActivityOrder = ActivityOrder = __decorate([
    (0, typeorm_1.Entity)('activity_orders')
], ActivityOrder);
//# sourceMappingURL=activity-order.entity.js.map