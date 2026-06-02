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
var SeedController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const seed_service_1 = require("./seed.service");
const common_2 = require("@nestjs/common");
let SeedController = SeedController_1 = class SeedController {
    constructor(seedService) {
        this.seedService = seedService;
        this.logger = new common_2.Logger(SeedController_1.name);
    }
    async autoImport() {
        this.logger.log('Starting auto-import from Connecticut and Iowa datasets');
        try {
            const result = await this.seedService.autoImportFromPublicDatasets();
            return {
                success: true,
                message: `Successfully imported ${result.totalImported} spirits`,
                details: result,
            };
        }
        catch (error) {
            this.logger.error('Auto-import failed:', error?.message ?? error);
            throw new common_1.BadRequestException(error?.message ?? 'Auto-import failed');
        }
    }
    async uploadCsv(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        this.logger.log(`Processing uploaded CSV: ${file.originalname}`);
        try {
            const result = await this.seedService.importFromUploadedCsv(file.buffer);
            return {
                success: true,
                message: `Successfully imported ${result.totalImported} spirits from ${file.originalname}`,
                details: result,
            };
        }
        catch (error) {
            this.logger.error('CSV upload failed:', error?.message ?? error);
            throw new common_1.BadRequestException(error?.message ?? 'CSV upload failed');
        }
    }
    async getStats() {
        const stats = await this.seedService.getDatabaseStats();
        return stats;
    }
    async seedTestDistilleries() {
        this.logger.log('Starting test distillery seeding');
        try {
            const result = await this.seedService.seedTestDistilleries();
            return {
                success: true,
                message: `Successfully seeded ${result.count} test distilleries`,
                count: result.count,
            };
        }
        catch (error) {
            this.logger.error('Test distillery seeding failed:', error?.message ?? error);
            throw new common_1.BadRequestException(error?.message ?? 'Failed to seed test distilleries');
        }
    }
};
exports.SeedController = SeedController;
__decorate([
    (0, common_1.Post)('auto-import'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SeedController.prototype, "autoImport", null);
__decorate([
    (0, common_1.Post)('upload-csv'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SeedController.prototype, "uploadCsv", null);
__decorate([
    (0, common_1.Post)('get-stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SeedController.prototype, "getStats", null);
__decorate([
    (0, common_1.Post)('seed-test-distilleries'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SeedController.prototype, "seedTestDistilleries", null);
exports.SeedController = SeedController = SeedController_1 = __decorate([
    (0, common_1.Controller)('api/seed'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [seed_service_1.SeedService])
], SeedController);
//# sourceMappingURL=seed.controller.js.map