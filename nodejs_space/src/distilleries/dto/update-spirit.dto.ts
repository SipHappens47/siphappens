import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';

export class UpdateSpiritDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  style?: string;

  @IsOptional()
  @IsNumber()
  abv?: number;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  bottleImage?: string;

  @IsOptional()
  @IsString()
  officialTastingNotes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  flavorTagIds?: string[];
}
