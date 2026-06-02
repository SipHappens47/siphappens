import { IsEmail, IsString, MinLength, IsBoolean, IsDateString, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DistillerySignupData {
  @ApiProperty({ example: '9 Orphans Distilleries' })
  @IsString()
  distilleryName: string;

  @ApiProperty({ example: 'Western Cape', required: false })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ example: 'South Africa', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: 'Craft distillery...', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ example: 'file-id-logo', required: false })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({ example: 'file-id-hero', required: false })
  @IsOptional()
  @IsString()
  heroImage?: string;

  @ApiProperty({ example: 'Whisky,Gin,Rum', required: false })
  @IsOptional()
  @IsString()
  spiritTypes?: string;
}

export class SignupDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  ageVerified: boolean;

  @ApiProperty({ example: '2024-02-26T10:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  ageVerificationTimestamp?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isDistilleryAccount?: boolean;

  @ApiProperty({ type: DistillerySignupData, required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DistillerySignupData)
  distilleryData?: DistillerySignupData;
}