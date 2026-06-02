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
exports.BarController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const bar_service_1 = require("./bar.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let BarController = class BarController {
    constructor(barService) {
        this.barService = barService;
    }
    async getBarFeed(req, category, flavorTags) {
        return this.barService.getBarFeed(req.user.userId, {
            category,
            flavorTags,
        });
    }
};
exports.BarController = BarController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get The Bar feed (Fellow Sippers shared pours only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of shared pours from connections' }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false, description: 'Filter by spirit category' }),
    (0, swagger_1.ApiQuery)({ name: 'flavorTags', required: false, description: 'Filter by flavor tags (comma-separated)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('flavorTags')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], BarController.prototype, "getBarFeed", null);
exports.BarController = BarController = __decorate([
    (0, swagger_1.ApiTags)('The Bar (Social Feed)'),
    (0, common_1.Controller)('api/bar'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [bar_service_1.BarService])
], BarController);
//# sourceMappingURL=bar.controller.js.map