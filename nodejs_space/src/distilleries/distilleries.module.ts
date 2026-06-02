import { Module } from '@nestjs/common';
import { DistilleriesController } from './distilleries.controller';
import { DistilleriesService } from './distilleries.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DistilleriesController],
  providers: [DistilleriesService],
  exports: [DistilleriesService],
})
export class DistilleriesModule {}
