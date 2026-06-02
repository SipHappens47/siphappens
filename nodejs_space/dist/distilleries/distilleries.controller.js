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
exports.DistilleriesController = void 0;
const common_1 = require("@nestjs/common");
const distilleries_service_1 = require("./distilleries.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const update_insights_dto_1 = require("./dto/update-insights.dto");
const add_spirit_dto_1 = require("./dto/add-spirit.dto");
const update_spirit_dto_1 = require("./dto/update-spirit.dto");
const update_profile_dto_1 = require("./dto/update-profile.dto");
let DistilleriesController = class DistilleriesController {
    constructor(distilleriesService) {
        this.distilleriesService = distilleriesService;
    }
    async search(q, req) {
        const searchTerm = q?.trim() ?? '';
        return this.distilleriesService.search(searchTerm, req.user.userId);
    }
    async discover(req) {
        return this.distilleriesService.discover(req.user.userId);
    }
    async getProfile(id, req) {
        return this.distilleriesService.getProfile(id, req.user.userId);
    }
    async getPours(id, req) {
        return this.distilleriesService.getPours(id, req.user.userId);
    }
    async getSpirits(id, req) {
        return this.distilleriesService.getSpirits(id, req.user.userId);
    }
    async toggleFollow(id, req) {
        return this.distilleriesService.toggleFollow(id, req.user.userId);
    }
    async updateInsights(id, spiritId, dto, req) {
        return this.distilleriesService.updateInsights(id, spiritId, req.user.userId, dto);
    }
    async getAnalytics(id, req) {
        return this.distilleriesService.getAnalytics(id, req.user.userId);
    }
    async addSpiritToShelf(id, dto, req) {
        return this.distilleriesService.addSpiritToShelf(id, req.user.userId, dto);
    }
    async updateSpiritOnShelf(id, spiritId, dto, req) {
        return this.distilleriesService.updateSpiritOnShelf(id, spiritId, req.user.userId, dto);
    }
    async deleteSpiritFromShelf(id, spiritId, req) {
        return this.distilleriesService.deleteSpiritFromShelf(id, spiritId, req.user.userId);
    }
    async updateDistilleryProfile(id, dto, req) {
        return this.distilleriesService.updateProfile(id, req.user.userId, dto);
    }
};
exports.DistilleriesController = DistilleriesController;
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DistilleriesController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('discover'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DistilleriesController.prototype, "discover", null);
__decorate([
    (0, common_1.Get)(':id/profile'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DistilleriesController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)(':id/pours'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DistilleriesController.prototype, "getPours", null);
__decorate([
    (0, common_1.Get)(':id/spirits'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DistilleriesController.prototype, "getSpirits", null);
__decorate([
    (0, common_1.Post)(':id/follow'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DistilleriesController.prototype, "toggleFollow", null);
__decorate([
    (0, common_1.Post)(':id/insights/:spiritId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('spiritId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_insights_dto_1.UpdateInsightsDto, Object]),
    __metadata("design:returntype", Promise)
], DistilleriesController.prototype, "updateInsights", null);
__decorate([
    (0, common_1.Get)(':id/analytics'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DistilleriesController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Post)(':id/shelf/spirits'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_spirit_dto_1.AddSpiritDto, Object]),
    __metadata("design:returntype", Promise)
], DistilleriesController.prototype, "addSpiritToShelf", null);
__decorate([
    (0, common_1.Put)(':id/shelf/spirits/:spiritId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('spiritId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_spirit_dto_1.UpdateSpiritDto, Object]),
    __metadata("design:returntype", Promise)
], DistilleriesController.prototype, "updateSpiritOnShelf", null);
__decorate([
    (0, common_1.Delete)(':id/shelf/spirits/:spiritId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('spiritId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], DistilleriesController.prototype, "deleteSpiritFromShelf", null);
__decorate([
    (0, common_1.Put)(':id/profile'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_profile_dto_1.UpdateProfileDto, Object]),
    __metadata("design:returntype", Promise)
], DistilleriesController.prototype, "updateDistilleryProfile", null);
exports.DistilleriesController = DistilleriesController = __decorate([
    (0, common_1.Controller)('api/distilleries'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [distilleries_service_1.DistilleriesService])
], DistilleriesController);
//# sourceMappingURL=distilleries.controller.js.map