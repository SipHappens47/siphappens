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
exports.RadarController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const radar_service_1 = require("./radar.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let RadarController = class RadarController {
    constructor(radarService) {
        this.radarService = radarService;
    }
    async addToRadar(req, spiritId) {
        return this.radarService.addToRadar(req.user.userId, spiritId);
    }
    async removeFromRadar(req, spiritId) {
        return this.radarService.removeFromRadar(req.user.userId, spiritId);
    }
    async getRadar(req) {
        return this.radarService.getRadar(req.user.userId);
    }
};
exports.RadarController = RadarController;
__decorate([
    (0, common_1.Post)(':spiritId'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a spirit to your radar (wishlist)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Spirit added to radar' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('spiritId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RadarController.prototype, "addToRadar", null);
__decorate([
    (0, common_1.Delete)(':spiritId'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a spirit from your radar' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Spirit removed from radar' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('spiritId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RadarController.prototype, "removeFromRadar", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get your radar (wishlist)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of spirits on your radar' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RadarController.prototype, "getRadar", null);
exports.RadarController = RadarController = __decorate([
    (0, swagger_1.ApiTags)('On My Radar (Wishlist)'),
    (0, common_1.Controller)('api/radar'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [radar_service_1.RadarService])
], RadarController);
//# sourceMappingURL=radar.controller.js.map