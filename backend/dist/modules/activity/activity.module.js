"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const activity_entity_1 = require("./entities/activity.entity");
const activity_registration_entity_1 = require("./entities/activity-registration.entity");
const activity_share_log_entity_1 = require("./entities/activity-share-log.entity");
const activity_order_entity_1 = require("./entities/activity-order.entity");
const activity_certificate_entity_1 = require("./entities/activity-certificate.entity");
const checkin_entity_1 = require("./entities/checkin.entity");
const user_entity_1 = require("../users/entities/user.entity");
const activity_controller_1 = require("./activity.controller");
const admin_activity_controller_1 = require("./admin-activity.controller");
const checkin_controller_1 = require("./checkin.controller");
const certificate_service_1 = require("./certificate.service");
const footprint_controller_1 = require("./footprint.controller");
const order_controller_1 = require("./order.controller");
const admin_order_controller_1 = require("./admin-order.controller");
const certificate_controller_1 = require("./certificate.controller");
const admin_certificate_controller_1 = require("./admin-certificate.controller");
let ActivityModule = class ActivityModule {
};
exports.ActivityModule = ActivityModule;
exports.ActivityModule = ActivityModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([activity_entity_1.Activity, activity_registration_entity_1.ActivityRegistration, activity_share_log_entity_1.ActivityShareLog, activity_order_entity_1.ActivityOrder, activity_certificate_entity_1.ActivityCertificate, checkin_entity_1.Checkin, user_entity_1.User])],
        controllers: [activity_controller_1.ActivityController, admin_activity_controller_1.AdminActivityController, checkin_controller_1.AdminCheckinController, footprint_controller_1.FootprintController, order_controller_1.OrderController, admin_order_controller_1.AdminOrderController, certificate_controller_1.CertificateController, admin_certificate_controller_1.AdminCertificateController],
        providers: [certificate_service_1.CertificateService],
    })
], ActivityModule);
//# sourceMappingURL=activity.module.js.map