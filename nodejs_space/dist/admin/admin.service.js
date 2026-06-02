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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AdminService = class AdminService {
    constructor(prisma) {
        this.prisma = prisma;
        this.ADMIN_EMAIL = 'john@doe.com';
    }
    async checkAdminAccess(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });
        if (!user || user.email !== this.ADMIN_EMAIL) {
            throw new common_1.ForbiddenException('Admin access required');
        }
    }
    async getUnverifiedDistilleries() {
        return this.prisma.distillery.findMany({
            where: {
                verified: false,
                isclaimed: true,
            },
            select: {
                id: true,
                name: true,
                region: true,
                country: true,
                logo: true,
                bio: true,
                spirittypes: true,
                createdat: true,
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdat: 'desc' },
        });
    }
    async verifyDistillery(distilleryId, adminUserId) {
        await this.checkAdminAccess(adminUserId);
        const distillery = await this.prisma.distillery.findUnique({
            where: { id: distilleryId },
        });
        if (!distillery) {
            throw new common_1.NotFoundException('Distillery not found');
        }
        return this.prisma.distillery.update({
            where: { id: distilleryId },
            data: { verified: true },
            select: {
                id: true,
                name: true,
                verified: true,
            },
        });
    }
    async rejectDistillery(distilleryId, adminUserId) {
        await this.checkAdminAccess(adminUserId);
        const distillery = await this.prisma.distillery.findUnique({
            where: { id: distilleryId },
        });
        if (!distillery) {
            throw new common_1.NotFoundException('Distillery not found');
        }
        return this.prisma.distillery.update({
            where: { id: distilleryId },
            data: { verified: false },
            select: {
                id: true,
                name: true,
                verified: true,
            },
        });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map