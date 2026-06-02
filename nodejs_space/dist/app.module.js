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
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const upload_module_1 = require("./upload/upload.module");
const spirits_module_1 = require("./spirits/spirits.module");
const pours_module_1 = require("./pours/pours.module");
const profile_module_1 = require("./profile/profile.module");
const flavor_tags_module_1 = require("./flavor-tags/flavor-tags.module");
const connections_module_1 = require("./connections/connections.module");
const cheers_module_1 = require("./cheers/cheers.module");
const bar_module_1 = require("./bar/bar.module");
const radar_module_1 = require("./radar/radar.module");
const search_module_1 = require("./search/search.module");
const badges_module_1 = require("./badges/badges.module");
const seed_module_1 = require("./seed/seed.module");
const distilleries_module_1 = require("./distilleries/distilleries.module");
const admin_module_1 = require("./admin/admin.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            upload_module_1.UploadModule,
            spirits_module_1.SpiritsModule,
            pours_module_1.PoursModule,
            profile_module_1.ProfileModule,
            flavor_tags_module_1.FlavorTagsModule,
            connections_module_1.ConnectionsModule,
            cheers_module_1.CheersModule,
            bar_module_1.BarModule,
            radar_module_1.RadarModule,
            search_module_1.SearchModule,
            badges_module_1.BadgesModule,
            seed_module_1.SeedModule,
            distilleries_module_1.DistilleriesModule,
            admin_module_1.AdminModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map