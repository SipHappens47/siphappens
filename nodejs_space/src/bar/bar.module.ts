import { Module } from '@nestjs/common';
import { BarController } from './bar.controller';
import { BarService } from './bar.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectionsModule } from '../connections/connections.module';
import { CheersModule } from '../cheers/cheers.module';
import { ModerationModule } from '../moderation/moderation.module';

@Module({
  imports: [ConnectionsModule, CheersModule, ModerationModule],
  controllers: [BarController],
  providers: [BarService, PrismaService],
})
export class BarModule {}
