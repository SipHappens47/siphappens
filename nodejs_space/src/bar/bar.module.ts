import { Module } from '@nestjs/common';
import { BarController } from './bar.controller';
import { BarService } from './bar.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectionsModule } from '../connections/connections.module';
import { CheersModule } from '../cheers/cheers.module';

@Module({
  imports: [ConnectionsModule, CheersModule],
  controllers: [BarController],
  providers: [BarService, PrismaService],
})
export class BarModule {}
