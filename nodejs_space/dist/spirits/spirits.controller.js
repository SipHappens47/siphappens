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
exports.SpiritsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const spirits_service_1 = require("./spirits.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const recognize_bottle_dto_1 = require("./dto/recognize-bottle.dto");
const create_spirit_dto_1 = require("./dto/create-spirit.dto");
const update_spirit_dto_1 = require("./dto/update-spirit.dto");
let SpiritsController = class SpiritsController {
    constructor(spiritsService) {
        this.spiritsService = spiritsService;
    }
    async recognizeBottle(dto) {
        return this.spiritsService.recognizeBottle(dto);
    }
    async searchBottleImages(query) {
        return this.spiritsService.searchBottleImages(query);
    }
    async searchSpirits(query) {
        return this.spiritsService.searchSpirits(query);
    }
    async createSpirit(dto) {
        return this.spiritsService.createSpirit(dto);
    }
    async getSpirit(id) {
        return this.spiritsService.getSpirit(id);
    }
    async updateSpirit(id, dto) {
        return this.spiritsService.updateSpirit(id, dto);
    }
};
exports.SpiritsController = SpiritsController;
__decorate([
    (0, common_1.Post)('recognize'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Recognize spirit from bottle image using AI' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bottle analyzed successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [recognize_bottle_dto_1.RecognizeBottleDto]),
    __metadata("design:returntype", Promise)
], SpiritsController.prototype, "recognizeBottle", null);
__decorate([
    (0, common_1.Get)('search-images'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Search for bottle images' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Image URLs returned' }),
    (0, swagger_1.ApiQuery)({ name: 'query', required: true, description: 'Search query for bottle images' }),
    __param(0, (0, common_1.Query)('query')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SpiritsController.prototype, "searchBottleImages", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Search spirits by name or distillery' }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Search results retrieved' }),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SpiritsController.prototype, "searchSpirits", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new spirit' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Spirit created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_spirit_dto_1.CreateSpiritDto]),
    __metadata("design:returntype", Promise)
], SpiritsController.prototype, "createSpirit", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get spirit details by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Spirit details retrieved' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Spirit not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SpiritsController.prototype, "getSpirit", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update spirit details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Spirit updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Spirit not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_spirit_dto_1.UpdateSpiritDto]),
    __metadata("design:returntype", Promise)
], SpiritsController.prototype, "updateSpirit", null);
exports.SpiritsController = SpiritsController = __decorate([
    (0, swagger_1.ApiTags)('Spirits'),
    (0, common_1.Controller)('api/spirits'),
    __metadata("design:paramtypes", [spirits_service_1.SpiritsService])
], SpiritsController);
//# sourceMappingURL=spirits.controller.js.map