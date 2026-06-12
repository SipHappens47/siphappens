import { Module } from '@nestjs/common';
import { CheersController } from './cheers.controller';
import { CheersService } from './cheers.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectionsModule } from '../connections/connections.module';

@Module({
  imports: [ConnectionsModule],
  controllers: [CheersController],
  providers: [CheersService, PrismaService],
  exports: [CheersService],
})
export class CheersModule {}
