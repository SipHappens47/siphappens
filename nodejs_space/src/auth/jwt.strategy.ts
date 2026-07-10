import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      // Fail loudly rather than silently verifying tokens against a known
      // fallback string, which would let anyone forge a token for any user.
      throw new Error('JWT_SECRET environment variable is not set');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: { sub: string; email: string; tokenVersion?: number; distilleryId?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    // Reject tokens issued before the user's last logout-everywhere. Tokens
    // minted before this feature have no tokenVersion and default to 0.
    if ((payload.tokenVersion ?? 0) !== user.tokenversion) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return {
      userId: user.id,
      email: user.email,
      distilleryId: payload.distilleryId,
    };
  }
}