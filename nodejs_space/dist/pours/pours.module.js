"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoursModule = void 0;
const common_1 = require("@nestjs/common");
const pours_controller_1 = require("./pours.controller");
const pours_service_1 = require("./pours.service");
const badges_module_1 = require("../badges/badges.module");
let PoursModule = class PoursModule {
};
exports.PoursModule = PoursModule;
exports.PoursModule = PoursModule = __decorate([
    (0, common_1.Module)({
        imports: [badges_module_1.BadgesModule],
        controllers: [pours_controller_1.PoursController],
        providers: [pours_service_1.PoursService],
    })
], PoursModule);
//# sourceMappingURL=pours.module.js.map