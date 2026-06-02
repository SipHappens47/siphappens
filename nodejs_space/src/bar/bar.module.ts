import { Module } from '@nestjs/common';
import { BarController } from './bar.controller';
import { BarService } from './bar.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectionsService } from '../connections/connections.service';
import { CheersService } from '../cheers/cheers.service';

@Module({
  controllers: [BarController],
  providers: [BarService, PrismaService, ConnectionsService, CheersService],
})
export class BarModule {}
