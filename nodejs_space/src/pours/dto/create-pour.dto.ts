import { IsString, IsBoolean, IsOptional, IsArray, IsUUID, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePourDto {
  @ApiProperty({ example: 'uuid-spirit-id' })
  @IsUUID()
  spiritId: string;

  @ApiProperty({ example: 'The smooth vanilla notes really hit the spot after a long day' })
  @IsString()
  @MinLength(10)
  whyItHit: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isShared?: boolean;

  @ApiProperty({ example: 'cloud-storage-path/pour.jpg', required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ example: ['uuid1', 'uuid2'], required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  flavorTagIds?: string[];
}