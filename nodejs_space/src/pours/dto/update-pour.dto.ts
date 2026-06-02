import { IsString, IsBoolean, IsOptional, IsArray, IsUUID, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePourDto {
  @ApiProperty({ example: 'The smooth vanilla notes really hit the spot', required: false })
  @IsOptional()
  @IsString()
  @MinLength(10)
  whyItHit?: string;

  @ApiProperty({ example: 'cloud-storage-path/pour.jpg', required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isShared?: boolean;

  @ApiProperty({ example: ['uuid1', 'uuid2'], required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  flavorTagIds?: string[];
}