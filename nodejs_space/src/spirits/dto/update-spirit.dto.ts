import { IsString, IsOptional, IsNumber, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSpiritDto {
  @ApiProperty({ example: 'Glenfiddich 12 Year Old', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'uuid-distillery-id', required: false })
  @IsOptional()
  @IsUUID()
  distilleryId?: string;

  @ApiProperty({ example: 'Whisky', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 'Single Malt', required: false })
  @IsOptional()
  @IsString()
  style?: string;

  @ApiProperty({ example: 40.0, required: false })
  @IsOptional()
  @IsNumber()
  abv?: number;

  @ApiProperty({ example: 'Speyside', required: false })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ example: 'cloud-storage-path/bottle.jpg', required: false })
  @IsOptional()
  @IsString()
  bottleImage?: string;

  @ApiProperty({ example: ['uuid1', 'uuid2'], required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  flavorTagIds?: string[];
}