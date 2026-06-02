import { Module } from '@nestjs/common';
import { RadarController } from './radar.controller';
import { RadarService } from './radar.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [RadarController],
  providers: [RadarService, PrismaService],
})
export class RadarModule {}
