import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiateMultipartDto {
  @ApiProperty({ example: 'large-video.mp4' })
  @IsString()
  fileName: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}