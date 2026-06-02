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
exports.BadgesController = void 0;
const common_1 = require("@nestjs/common");
const badges_service_1 = require("./badges.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
let BadgesController = class BadgesController {
    constructor(badgesService) {
        this.badgesService = badgesService;
    }
    async getMyBadges(req) {
        const userId = req?.user?.userId;
        if (!userId) {
            throw new Error('User ID not found in request');
        }
        return this.badgesService.getUserBadgesWithProgress(userId);
    }
    async getTasteSummary(req) {
        const userId = req?.user?.userId;
        if (!userId) {
            throw new Error('User ID not found in request');
        }
        return this.badgesService.getTasteSummary(userId);
    }
    async getUserBadges(userId) {
        return this.badgesService.getUserBadgesWithProgress(userId);
    }
    async getUserTasteSummary(userId) {
        return this.badgesService.getTasteSummary(userId);
    }
};
exports.BadgesController = BadgesController;
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get current user badges with progress',
        description: 'Returns all badges with unlock status and progress toward each tier',
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BadgesController.prototype, "getMyBadges", null);
__decorate([
    (0, common_1.Get)('taste-summary'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get taste summary statistics',
        description: 'Returns flavor count, region count, distillery count, and distributions',
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BadgesController.prototype, "getTasteSummary", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get public user badges with progress',
        description: 'Returns all badges with unlock status and progress for a specific user',
    }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BadgesController.prototype, "getUserBadges", null);
__decorate([
    (0, common_1.Get)('user/:userId/taste-summary'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get public user taste summary',
        description: 'Returns flavor count, region count, distillery count, and distributions for a specific user',
    }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BadgesController.prototype, "getUserTasteSummary", null);
exports.BadgesController = BadgesController = __decorate([
    (0, swagger_1.ApiTags)('badges'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('api/badges'),
    __metadata("design:paramtypes", [badges_service_1.BadgesService])
], BadgesController);
//# sourceMappingURL=badges.controller.js.map