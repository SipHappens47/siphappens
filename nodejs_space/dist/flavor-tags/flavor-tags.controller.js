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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlavorTagsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const flavor_tags_service_1 = require("./flavor-tags.service");
let FlavorTagsController = class FlavorTagsController {
    constructor(flavorTagsService) {
        this.flavorTagsService = flavorTagsService;
    }
    async getAllFlavorTags() {
        return this.flavorTagsService.getAllFlavorTags();
    }
};
exports.FlavorTagsController = FlavorTagsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all available flavor tags' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Flavor tags retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FlavorTagsController.prototype, "getAllFlavorTags", null);
exports.FlavorTagsController = FlavorTagsController = __decorate([
    (0, swagger_1.ApiTags)('Flavor Tags'),
    (0, common_1.Controller)('api/flavor-tags'),
    __metadata("design:paramtypes", [flavor_tags_service_1.FlavorTagsService])
], FlavorTagsController);
//# sourceMappingURL=flavor-tags.controller.js.map