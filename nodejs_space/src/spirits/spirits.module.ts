import { Module } from '@nestjs/common';
import { SpiritsController } from './spirits.controller';
import { SpiritsService } from './spirits.service';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule],
  controllers: [SpiritsController],
  providers: [SpiritsService],
})
export class SpiritsModule {}