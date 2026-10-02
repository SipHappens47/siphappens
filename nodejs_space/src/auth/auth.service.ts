import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { sendEmail } from '../lib/email';
import { isReservedAdminSignup } from '../admin/admin.service';
import { isBannedEmail } from '../moderation/banned-emails';

const DISTILLERY_ALREADY_CLAIMED =
  'This distillery has already been claimed. Contact SipHappens support if you manage it.';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { email, password, name, ageVerified, ageVerificationTimestamp, isDistilleryAccount, distilleryData } = signupDto;

    if (!ageVerified) {
      throw new BadRequestException('Age verification is required');
    }

    if (isReservedAdminSignup(email)) {
      throw new BadRequestException('This email address is reserved');
    }

    if (await isBannedEmail(this.prisma, email)) {
      throw new BadRequestException(
        "This email address can't be used to create an account. Contact SipHappens support if you think this is a mistake.",
      );
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    // A distillery that already has an owner cannot be re-claimed through
    // signup: that would displace the owner and reset its verification.
    // Checked before the account is created so a refused claim leaves nothing behind.
    let existingDistillery: any = null;
    if (isDistilleryAccount && distilleryData) {
      existingDistillery = await this.prisma.distillery.findFirst({
        where: {
          name: {
            equals: distilleryData.distilleryName,
            mode: 'insensitive',
          },
        },
      });
      if (existingDistillery?.owneruserid) {
        throw new BadRequestException(DISTILLERY_ALREADY_CLAIMED);
      }
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

    // Auto-follow SipHappens official account
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
    } catch (err: any) {
      // Non-fatal: don't block signup if auto-follow fails
      console.error('[AuthService] Auto-follow SipHappens failed:', err?.message);
    }

    // Handle distillery account signup
    let distillery: any = null;
    if (isDistilleryAccount && distilleryData) {
      if (existingDistillery) {
        // Link to an existing, unowned (seeded) distillery. The claim is one
        // conditional UPDATE, so of two parallel signups only one can win.
        const claimed = await this.prisma.distillery.updateMany({
          where: { id: existingDistillery.id, owneruserid: null },
          data: {
            owneruserid: user.id,
            verified: false, // Pending verification by admin
            isclaimed: true, // User-claimed distillery
            // Update other fields if provided
            ...(distilleryData.region && { region: distilleryData.region.trim() }),
            ...(distilleryData.country && { country: distilleryData.country.trim() }),
            ...(distilleryData.bio && { bio: distilleryData.bio.trim() }),
            ...(distilleryData.logo && { logo: distilleryData.logo }),
            ...(distilleryData.heroImage && { heroimage: distilleryData.heroImage }),
            ...(distilleryData.spiritTypes && { spirittypes: distilleryData.spiritTypes.trim() }),
          },
        });
        if (claimed.count !== 1) {
          // Someone else claimed it since the check above: undo this signup.
          await this.prisma.user.delete({ where: { id: user.id } });
          throw new BadRequestException(DISTILLERY_ALREADY_CLAIMED);
        }
        distillery = await this.prisma.distillery.findUnique({ where: { id: existingDistillery.id } });
      } else {
        // Create new distillery - pending verification
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
            verified: false, // Pending verification by admin
            isclaimed: true, // User-created distillery
          },
        });
      }
    }

    // Distillery powers require admin verification; a freshly claimed distillery is
    // unverified, so the account behaves as a normal user until an admin approves it.
    distillery = distillery && distillery.verified ? distillery : null;

    // Generate token with distillery information if applicable
    const token = this.generateToken(user.id, user.email, user.tokenversion, distillery?.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: distillery ? distillery.name : user.name, // Use distillery name for distillery accounts
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

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({ 
      where: { email },
      include: {
        owneddistillery: true, // Include owned distillery if exists
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Distillery powers require an admin-verified claim; unverified owners act as normal users.
    const owned = user.owneddistillery?.[0];
    const distillery = owned && owned.verified ? owned : null;

    // Generate token with distillery information if applicable
    const token = this.generateToken(user.id, user.email, user.tokenversion, distillery?.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: distillery ? distillery.name : user.name, // Use distillery name for distillery accounts
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

  async getMe(userId: string) {
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
      throw new UnauthorizedException();
    }

    const owned = user.owneddistillery?.[0];
    const distillery = owned && owned.verified ? owned : null;

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

  private generateToken(userId: string, email: string, tokenVersion: number, distilleryId?: string): string {
    const payload: any = { sub: userId, email, tokenVersion };
    if (distilleryId) {
      payload.distilleryId = distilleryId;
    }
    // 30 days (was 10 years). The app signs out on a 401 at its startup
    // session check; logout-all and password reset still revoke earlier.
    return this.jwtService.sign(payload, { expiresIn: '30d' });
  }

  // Invalidate every existing token for a user (logout-everywhere). Bumping the
  // stored version makes any previously issued token fail verification, without
  // rotating JWT_SECRET (which would log out all users at once).
  async logoutAll(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenversion: { increment: 1 } },
    });
    return { success: true };
  }

  // Emails a 6-digit reset code. Always returns the same generic response so
  // the endpoint can't be used to probe which emails have accounts.
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      const code = randomInt(100000, 1000000).toString(); // CSPRNG, 6 digits
      const codeHash = await bcrypt.hash(code, 10);
      const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await this.prisma.user.update({
        where: { id: user.id },
        data: { resetcodehash: codeHash, resetcodeexpiry: expiry },
      });

      try {
        await sendEmail(
          email,
          'Your SipHappens password reset code',
          `<p>Your password reset code is <strong style="font-size:20px">${code}</strong>.</p>` +
            `<p>It expires in 15 minutes. If you didn't request this, you can ignore this email.</p>`,
        );
      } catch {
        // Don't leak send failures to the caller; it's logged in the helper.
      }
    }

    return { message: 'If that email has an account, a reset code has been sent.' };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.resetcodehash || !user.resetcodeexpiry) {
      throw new BadRequestException('Invalid or expired reset code');
    }
    if (user.resetcodeexpiry < new Date()) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const codeValid = await bcrypt.compare(code, user.resetcodehash);
    if (!codeValid) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetcodehash: null,
        resetcodeexpiry: null,
        // Revoke any existing sessions after a password reset.
        tokenversion: { increment: 1 },
      },
    });

    return { success: true };
  }
}