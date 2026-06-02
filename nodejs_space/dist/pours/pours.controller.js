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
exports.PoursController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const pours_service_1 = require("./pours.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const create_pour_dto_1 = require("./dto/create-pour.dto");
const update_pour_dto_1 = require("./dto/update-pour.dto");
let PoursController = class PoursController {
    constructor(poursService) {
        this.poursService = poursService;
    }
    async createPour(req, dto) {
        return this.poursService.createPour(req.user.userId, dto);
    }
    async getPours(req, category, flavorTags, startDate, endDate, search) {
        return this.poursService.getPours(req.user.userId, {
            category,
            flavorTags,
            startDate,
            endDate,
            search,
        });
    }
    async getUserPublicPours(userId) {
        return this.poursService.getUserPublicPours(userId);
    }
    async getPour(req, id) {
        return this.poursService.getPour(req.user.userId, id);
    }
    async updatePour(req, id, dto) {
        return this.poursService.updatePour(req.user.userId, id, dto);
    }
    async deletePour(req, id) {
        return this.poursService.deletePour(req.user.userId, id);
    }
};
exports.PoursController = PoursController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new pour entry' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Pour created successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_pour_dto_1.CreatePourDto]),
    __metadata("design:returntype", Promise)
], PoursController.prototype, "createPour", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user pours with optional filters' }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'flavorTags', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Pours retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('flavorTags')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __param(5, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], PoursController.prototype, "getPours", null);
__decorate([
    (0, common_1.Get)('user/:userId/public'),
    (0, swagger_1.ApiOperation)({ summary: 'Get public pours for a specific user (shared to The Bar)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Public pours retrieved successfully' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PoursController.prototype, "getUserPublicPours", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pour details by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Pour details retrieved' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Pour not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PoursController.prototype, "getPour", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update pour details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Pour updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Pour not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_pour_dto_1.UpdatePourDto]),
    __metadata("design:returntype", Promise)
], PoursController.prototype, "updatePour", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a pour' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Pour deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Pour not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PoursController.prototype, "deletePour", null);
exports.PoursController = PoursController = __decorate([
    (0, swagger_1.ApiTags)('Pours'),
    (0, common_1.Controller)('api/pours'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [pours_service_1.PoursService])
], PoursController);
//# sourceMappingURL=pours.controller.js.map