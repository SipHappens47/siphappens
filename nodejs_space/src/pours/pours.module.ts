import { Module } from '@nestjs/common';
import { PoursController } from './pours.controller';
import { PoursService } from './pours.service';
import { BadgesModule } from '../badges/badges.module';

@Module({
  imports: [BadgesModule],
  controllers: [PoursController],
  providers: [PoursService],
})
export class PoursModule {}