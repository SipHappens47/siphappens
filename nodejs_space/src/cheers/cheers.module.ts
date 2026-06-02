import { Module } from '@nestjs/common';
import { CheersController } from './cheers.controller';
import { CheersService } from './cheers.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectionsService } from '../connections/connections.service';

@Module({
  controllers: [CheersController],
  providers: [CheersService, PrismaService, ConnectionsService],
})
export class CheersModule {}
