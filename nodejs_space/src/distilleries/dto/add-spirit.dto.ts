import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';

export class AddSpiritDto {
  @IsString()
  name: string;

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

  @IsString()
  bottleImage: string; // Required for distillery shelf

  @IsOptional()
  @IsString()
  officialTastingNotes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  flavorTagIds?: string[];
}
