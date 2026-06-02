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
exports.ProfileService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProfileService = class ProfileService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                profilephoto: true,
                bio: true,
                experiencelevel: true,
                ageverified: true,
                createdat: true,
                owneddistillery: {
                    select: {
                        id: true,
                        name: true,
                        bio: true,
                        logo: true,
                    },
                },
            },
        });
        if (!user) {
            throw new Error('User not found');
        }
        let displayName = user.name;
        let displayBio = user.bio;
        let displayPhoto = user.profilephoto;
        const distillery = user.owneddistillery?.[0];
        if (distillery) {
            displayName = distillery.name;
            displayBio = distillery.bio || user.bio;
            displayPhoto = distillery.logo || user.profilephoto;
        }
        return {
            id: user.id,
            email: user.email,
            name: displayName,
            profilePhoto: displayPhoto,
            bio: displayBio,
            experienceLevel: user.experiencelevel,
            ageVerified: user.ageverified,
            createdAt: user.createdat,
        };
    }
    async updateProfile(userId, dto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.profilePhoto !== undefined && { profilephoto: dto.profilePhoto }),
                ...(dto.bio !== undefined && { bio: dto.bio }),
                ...(dto.experienceLevel && { experiencelevel: dto.experienceLevel }),
            },
            select: {
                id: true,
                email: true,
                name: true,
                profilephoto: true,
                bio: true,
                experiencelevel: true,
                ageverified: true,
                createdat: true,
            },
        });
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            profilePhoto: user.profilephoto,
            bio: user.bio,
            experienceLevel: user.experiencelevel,
            ageVerified: user.ageverified,
            createdAt: user.createdat,
        };
    }
    async updatePhoto(userId, dto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                profilephoto: dto.profilePhoto,
            },
            select: {
                id: true,
                email: true,
                name: true,
                profilephoto: true,
                bio: true,
                experiencelevel: true,
                ageverified: true,
                createdat: true,
            },
        });
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            profilePhoto: user.profilephoto,
            bio: user.bio,
            experienceLevel: user.experiencelevel,
            ageVerified: user.ageverified,
            createdAt: user.createdat,
        };
    }
    async getPublicProfile(userId) {
        try {
            console.log('[ProfileService] Getting public profile for userId:', userId);
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    name: true,
                    profilephoto: true,
                    bio: true,
                    experiencelevel: true,
                    isofficial: true,
                    createdat: true,
                },
            });
            if (!user) {
                console.log('[ProfileService] User not found:', userId);
                throw new common_1.NotFoundException('User not found');
            }
            console.log('[ProfileService] User found:', user.name);
            return {
                id: user.id,
                name: user.name,
                profilePhoto: user.profilephoto,
                bio: user.bio,
                experienceLevel: user.experiencelevel,
                isOfficial: user.isofficial ?? false,
                createdAt: user.createdat,
            };
        }
        catch (error) {
            console.error('[ProfileService] Error getting public profile:', error);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.NotFoundException('User not found');
        }
    }
};
exports.ProfileService = ProfileService;
exports.ProfileService = ProfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProfileService);
//# sourceMappingURL=profile.service.js.map