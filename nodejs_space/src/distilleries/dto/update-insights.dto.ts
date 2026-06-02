import { IsString, IsOptional } from 'class-validator';

export class UpdateInsightsDto {
  @IsOptional()
  @IsString()
  howWeCreated?: string;

  @IsOptional()
  @IsString()
  whatMakesItSpecial?: string;

  @IsOptional()
  @IsString()
  tastingNotes?: string;
}
