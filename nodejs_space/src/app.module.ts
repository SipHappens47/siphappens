import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { SpiritsModule } from './spirits/spirits.module';
import { PoursModule } from './pours/pours.module';
import { ProfileModule } from './profile/profile.module';
import { FlavorTagsModule } from './flavor-tags/flavor-tags.module';
import { ConnectionsModule } from './connections/connections.module';
import { CheersModule } from './cheers/cheers.module';
import { BarModule } from './bar/bar.module';
import { RadarModule } from './radar/radar.module';
import { SearchModule } from './search/search.module';
import { BadgesModule } from './badges/badges.module';
import { SeedModule } from './seed/seed.module';
import { DistilleriesModule } from './distilleries/distilleries.module';
import { AdminModule } from './admin/admin.module';
import { ModerationModule } from './moderation/moderation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Global rate limit: 100 requests / 60s per IP. Tighter limits on the
    // auth routes are set with @Throttle on those handlers.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UploadModule,
    SpiritsModule,
    PoursModule,
    ProfileModule,
    FlavorTagsModule,
    ConnectionsModule,
    CheersModule,
    BarModule,
    RadarModule,
    SearchModule,
    BadgesModule,
    SeedModule,
    DistilleriesModule,
    AdminModule,
    ModerationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
