import { IsString, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class PartInfo {
  @ApiProperty({ example: '"abc123etag"' })
  @IsString()
  ETag: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  PartNumber: number;
}

export class CompleteMultipartDto {
  @ApiProperty({ example: 'uploads/1234567890-large-video.mp4' })
  @IsString()
  cloud_storage_path: string;

  @ApiProperty({ example: 'abc123uploadid' })
  @IsString()
  uploadId: string;

  @ApiProperty({ type: [PartInfo] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartInfo)
  parts: PartInfo[];

  @ApiProperty({ example: 'large-video.mp4' })
  @IsString()
  fileName: string;

  @ApiProperty({ example: 'video/mp4' })
  @IsString()
  mimeType: string;

  @ApiProperty({ example: 104857600 })
  @IsNumber()
  fileSize: number;
}