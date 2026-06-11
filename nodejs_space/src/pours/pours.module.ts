import { Module } from '@nestjs/common';
import { PoursController } from './pours.controller';
import { PoursService } from './pours.service';
import { BadgesModule } from '../badges/badges.module';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [BadgesModule, ProfileModule],
  controllers: [PoursController],
  providers: [PoursService],
})
export class PoursModule {}