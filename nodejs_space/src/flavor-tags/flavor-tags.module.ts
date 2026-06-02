import { Module } from '@nestjs/common';
import { FlavorTagsController } from './flavor-tags.controller';
import { FlavorTagsService } from './flavor-tags.service';

@Module({
  controllers: [FlavorTagsController],
  providers: [FlavorTagsService],
})
export class FlavorTagsModule {}