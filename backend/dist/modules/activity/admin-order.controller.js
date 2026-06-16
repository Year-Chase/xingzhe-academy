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
exports.AdminOrderController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const activity_order_entity_1 = require("./entities/activity-order.entity");
let AdminOrderController = class AdminOrderController {
    constructor(orderRepo) {
        this.orderRepo = orderRepo;
    }
    async list() {
        const orders = await this.orderRepo.find({ order: { createdAt: 'DESC' }, take: 100 });
        return { code: 0, message: 'success', data: orders };
    }
    async refund(id) {
        const order = await this.orderRepo.findOne({ where: { id } });
        if (!order)
            return { code: 10002, message: '订单不存在', data: null };
        if (order.status !== 'PAID')
            return { code: 40502, message: '只能退款已支付订单', data: null };
        order.status = 'REFUNDED';
        order.refundTime = new Date();
        await this.orderRepo.save(order);
        return { code: 0, message: '已标记退款', data: { id: order.id, status: 'REFUNDED' } };
    }
};
exports.AdminOrderController = AdminOrderController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminOrderController.prototype, "list", null);
__decorate([
    (0, common_1.Put)(':id/refund'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminOrderController.prototype, "refund", null);
exports.AdminOrderController = AdminOrderController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('admin/orders'),
    __param(0, (0, typeorm_1.InjectRepository)(activity_order_entity_1.ActivityOrder)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AdminOrderController);
//# sourceMappingURL=admin-order.controller.js.map