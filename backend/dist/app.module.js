"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const diary_module_1 = require("./modules/diary/diary.module");
const analysis_module_1 = require("./modules/analysis/analysis.module");
const speech_module_1 = require("./modules/speech/speech.module");
const admin_module_1 = require("./modules/admin/admin.module");
const invite_module_1 = require("./modules/invite/invite.module");
const intervention_module_1 = require("./modules/intervention/intervention.module");
const activity_module_1 = require("./modules/activity/activity.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', '.env.local'],
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'mysql',
                    host: config.get('DB_HOST', 'localhost'),
                    port: config.get('DB_PORT', 3306),
                    username: config.get('DB_USERNAME', 'root'),
                    password: config.get('DB_PASSWORD', ''),
                    database: config.get('DB_DATABASE', 'tenselog'),
                    entities: [__dirname + '/**/*.entity{.ts,.js}'],
                    synchronize: true,
                    logging: config.get('NODE_ENV') === 'development',
                    decimalNumbers: true,
                }),
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            diary_module_1.DiaryModule,
            analysis_module_1.AnalysisModule,
            speech_module_1.SpeechModule,
            admin_module_1.AdminModule,
            invite_module_1.InviteModule,
            intervention_module_1.InterventionModule,
            activity_module_1.ActivityModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map