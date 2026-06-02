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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async signup(signupDto) {
        const { email, password, name, ageVerified, ageVerificationTimestamp, isDistilleryAccount, distilleryData } = signupDto;
        if (!ageVerified) {
            throw new common_1.BadRequestException('Age verification is required');
        }
        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new common_1.BadRequestException('Email already in use');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: email?.trim(),
                password: hashedPassword,
                name: name?.trim(),
                ageverified: ageVerified,
                ageverificationtimestamp: ageVerificationTimestamp ? new Date(ageVerificationTimestamp) : new Date(),
            },
        });
        try {
            const officialAccount = await this.prisma.user.findFirst({ where: { isofficial: true } });
            if (officialAccount) {
                await this.prisma.connection.create({
                    data: {
                        initiatorid: officialAccount.id,
                        receiverid: user.id,
                        status: 'Accepted',
                        acceptedat: new Date(),
                    },
                });
            }
        }
        catch (err) {
            console.error('[AuthService] Auto-follow SipHappens failed:', err?.message);
        }
        let distillery = null;
        if (isDistilleryAccount && distilleryData) {
            const existingDistillery = await this.prisma.distillery.findFirst({
                where: {
                    name: {
                        equals: distilleryData.distilleryName,
                        mode: 'insensitive',
                    },
                },
            });
            if (existingDistillery) {
                distillery = await this.prisma.distillery.update({
                    where: { id: existingDistillery.id },
                    data: {
                        owneruserid: user.id,
                        verified: false,
                        isclaimed: true,
                        ...(distilleryData.region && { region: distilleryData.region.trim() }),
                        ...(distilleryData.country && { country: distilleryData.country.trim() }),
                        ...(distilleryData.bio && { bio: distilleryData.bio.trim() }),
                        ...(distilleryData.logo && { logo: distilleryData.logo }),
                        ...(distilleryData.heroImage && { heroimage: distilleryData.heroImage }),
                        ...(distilleryData.spiritTypes && { spirittypes: distilleryData.spiritTypes.trim() }),
                    },
                });
            }
            else {
                distillery = await this.prisma.distillery.create({
                    data: {
                        name: distilleryData.distilleryName?.trim(),
                        region: distilleryData.region?.trim(),
                        country: distilleryData.country?.trim(),
                        bio: distilleryData.bio?.trim(),
                        logo: distilleryData.logo,
                        heroimage: distilleryData.heroImage,
                        spirittypes: distilleryData.spiritTypes?.trim(),
                        owneruserid: user.id,
                        verified: false,
                        isclaimed: true,
                    },
                });
            }
        }
        const token = this.generateToken(user.id, user.email, distillery?.id);
        return {
            user: {
                id: user.id,
                email: user.email,
                name: distillery ? distillery.name : user.name,
                experienceLevel: user.experiencelevel,
                distilleryId: distillery?.id,
                isDistilleryAccount: !!distillery,
                profilePhoto: distillery ? distillery.logo : user.profilephoto,
                bio: distillery ? distillery.bio : user.bio,
            },
            token,
            distillery: distillery ? {
                id: distillery.id,
                name: distillery.name,
                verified: distillery.verified,
                logo: distillery.logo,
                heroImage: distillery.heroimage,
            } : null,
        };
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: {
                owneddistillery: true,
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const distillery = user.owneddistillery?.[0];
        const token = this.generateToken(user.id, user.email, distillery?.id);
        return {
            user: {
                id: user.id,
                email: user.email,
                name: distillery ? distillery.name : user.name,
                experienceLevel: user.experiencelevel,
                distilleryId: distillery?.id,
                isDistilleryAccount: !!distillery,
                profilePhoto: distillery ? distillery.logo : user.profilephoto,
                bio: distillery ? distillery.bio : user.bio,
            },
            token,
            distillery: distillery ? {
                id: distillery.id,
                name: distillery.name,
                verified: distillery.verified,
                logo: distillery.logo,
                heroImage: distillery.heroimage,
            } : null,
        };
    }
    async getMe(userId) {
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
                isofficial: true,
                createdat: true,
                owneddistillery: {
                    select: {
                        id: true,
                        name: true,
                        verified: true,
                        logo: true,
                        heroimage: true,
                        bio: true,
                        region: true,
                        country: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException();
        }
        const distillery = user.owneddistillery?.[0];
        return {
            id: user.id,
            email: user.email,
            name: distillery ? distillery.name : user.name,
            profilePhoto: distillery ? distillery.logo : user.profilephoto,
            bio: distillery ? distillery.bio : user.bio,
            experienceLevel: user.experiencelevel,
            ageVerified: user.ageverified,
            createdAt: user.createdat,
            distilleryId: distillery?.id,
            isDistilleryAccount: !!distillery,
            distillery: distillery ? {
                id: distillery.id,
                name: distillery.name,
                verified: distillery.verified,
                logo: distillery.logo,
                heroImage: distillery.heroimage,
                bio: distillery.bio,
                region: distillery.region,
                country: distillery.country,
            } : null,
        };
    }
    generateToken(userId, email, distilleryId) {
        const payload = { sub: userId, email };
        if (distilleryId) {
            payload.distilleryId = distilleryId;
        }
        return this.jwtService.sign(payload, { expiresIn: '7d' });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map