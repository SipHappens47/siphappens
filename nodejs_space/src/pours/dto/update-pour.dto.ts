import { IsString, IsBoolean, IsOptional, IsArray, IsUUID, MinLength, IsInt, Min, Max, IsIn } from 'class-validator';
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

  @ApiProperty({ example: 'Vanilla,Oak,Smoky finish', required: false, description: 'Comma-separated flavour tag names (category + custom)' })
  @IsOptional()
  @IsString()
  flavorTags?: string;

  @ApiProperty({ example: 4, required: false, description: 'Star rating 1-5' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({ example: 'Yes', required: false, enum: ['Yes', 'No', 'Maybe'] })
  @IsOptional()
  @IsIn(['Yes', 'No', 'Maybe'])
  wouldPourAgain?: string;

  @ApiProperty({ example: 'Casual,With food', required: false, description: 'Comma-separated occasions, max 3' })
  @IsOptional()
  @IsString()
  occasions?: string;
}