import { Module } from '@nestjs/common';
import { SpiritsController } from './spirits.controller';
import { SpiritsService } from './spirits.service';

@Module({
  controllers: [SpiritsController],
  providers: [SpiritsService],
})
export class SpiritsModule {}