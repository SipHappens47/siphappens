import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetPartUrlDto {
  @ApiProperty({ example: 'uploads/1234567890-large-video.mp4' })
  @IsString()
  cloud_storage_path: string;

  @ApiProperty({ example: 'abc123uploadid' })
  @IsString()
  uploadId: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  partNumber: number;
}