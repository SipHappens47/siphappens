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
exports.CheersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cheers_service_1 = require("./cheers.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let CheersController = class CheersController {
    constructor(cheersService) {
        this.cheersService = cheersService;
    }
    async addCheer(req, pourId) {
        return this.cheersService.addCheer(req.user.userId, pourId);
    }
    async removeCheer(req, pourId) {
        return this.cheersService.removeCheer(req.user.userId, pourId);
    }
};
exports.CheersController = CheersController;
__decorate([
    (0, common_1.Post)(':pourId'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a cheer to a pour (Fellow Sippers only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Cheer added' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('pourId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CheersController.prototype, "addCheer", null);
__decorate([
    (0, common_1.Delete)(':pourId'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove your cheer from a pour' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cheer removed' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('pourId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CheersController.prototype, "removeCheer", null);
exports.CheersController = CheersController = __decorate([
    (0, swagger_1.ApiTags)('Cheers'),
    (0, common_1.Controller)('api/cheers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [cheers_service_1.CheersService])
], CheersController);
//# sourceMappingURL=cheers.controller.js.map