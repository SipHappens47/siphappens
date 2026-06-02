import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDistilleryDto {
  @ApiProperty({ example: 'Glenfiddich' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Scotland', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: 'Speyside', required: false })
  @IsOptional()
  @IsString()
  region?: string;
}