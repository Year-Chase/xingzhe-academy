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
exports.OrderController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const activity_entity_1 = require("./entities/activity.entity");
const activity_registration_entity_1 = require("./entities/activity-registration.entity");
const activity_order_entity_1 = require("./entities/activity-order.entity");
function genOrderNo() {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const seq = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `ACT${date}${seq}`;
}
let OrderController = class OrderController {
    constructor(actRepo, regRepo, orderRepo) {
        this.actRepo = actRepo;
        this.regRepo = regRepo;
        this.orderRepo = orderRepo;
    }
    async create(userId, activityId) {
        const activity = await this.actRepo.findOne({ where: { id: activityId } });
        if (!activity)
            return { code: 10002, message: '活动不存在', data: null };
        if (activity.status !== 'PUBLISHED')
            return { code: 40406, message: '活动不在报名期', data: null };
        const existing = await this.orderRepo.findOne({ where: { activityId, userId, status: 'PENDING' } });
        if (existing)
            return { code: 0, message: '已有待支付订单', data: { id: existing.id, orderNo: existing.orderNo, amount: existing.amount, status: existing.status } };
        if (activity.price > 0 && activity.capacity) {
            const paid = await this.regRepo.count({ where: { activityId, status: 'REGISTERED' } });
            if (paid >= activity.capacity)
                return { code: 10003, message: '这个活动暂时已满', data: null };
        }
        const order = new activity_order_entity_1.ActivityOrder();
        order.id = (0, uuid_1.v4)();
        order.orderNo = genOrderNo();
        order.userId = userId;
        order.activityId = activityId;
        order.amount = activity.price;
        order.status = 'PENDING';
        await this.orderRepo.save(order);
        return { code: 0, message: 'success', data: { id: order.id, orderNo: order.orderNo, amount: order.amount, status: order.status } };
    }
    async mockPay(userId, orderId) {
        const order = await this.orderRepo.findOne({ where: { id: orderId, userId } });
        if (!order)
            return { code: 10002, message: '订单不存在', data: null };
        if (order.status !== 'PENDING')
            return { code: 40502, message: '订单状态异常', data: null };
        order.status = 'PAID';
        order.payTime = new Date();
        await this.orderRepo.save(order);
        let reg = await this.regRepo.findOne({ where: { activityId: order.activityId, userId } });
        if (reg) {
            if (reg.status !== 'REGISTERED') {
                reg.status = 'REGISTERED';
                await this.regRepo.save(reg);
            }
        }
        else {
            reg = new activity_registration_entity_1.ActivityRegistration();
            reg.id = (0, uuid_1.v4)();
            reg.activityId = order.activityId;
            reg.userId = userId;
            reg.status = 'REGISTERED';
            await this.regRepo.save(reg);
        }
        return { code: 0, message: '支付成功', data: { orderNo: order.orderNo, status: 'PAID', registrationId: reg.id } };
    }
    async myOrders(userId) {
        const orders = await this.orderRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
        if (orders.length === 0)
            return { code: 0, message: 'success', data: [] };
        const ids = [...new Set(orders.map(o => o.activityId))];
        const activities = await this.actRepo.findByIds(ids);
        const map = new Map(activities.map(a => [a.id, a]));
        return { code: 0, message: 'success', data: orders.map(o => ({ ...o, activity: map.get(o.activityId) || null })) };
    }
    async cancel(id, userId) {
        const order = await this.orderRepo.findOne({ where: { id, userId } });
        if (!order)
            return { code: 10002, message: '订单不存在', data: null };
        if (order.status !== 'PENDING')
            return { code: 40502, message: '只能取消待支付订单', data: null };
        order.status = 'CANCELLED';
        await this.orderRepo.save(order);
        return { code: 0, message: '已取消', data: { id: order.id, status: 'CANCELLED' } };
    }
};
exports.OrderController = OrderController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('create'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)('activityId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('pay'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "mockPay", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('my'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "myOrders", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Put)(':id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "cancel", null);
exports.OrderController = OrderController = __decorate([
    (0, common_1.Controller)('orders'),
    __param(0, (0, typeorm_1.InjectRepository)(activity_entity_1.Activity)),
    __param(1, (0, typeorm_1.InjectRepository)(activity_registration_entity_1.ActivityRegistration)),
    __param(2, (0, typeorm_1.InjectRepository)(activity_order_entity_1.ActivityOrder)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], OrderController);
//# sourceMappingURL=order.controller.js.map