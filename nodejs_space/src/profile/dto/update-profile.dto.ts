import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum ExperienceLevel {
  Curious = 'Curious',
  Social = 'Social',
  Serious = 'Serious',
}

export class UpdateProfileDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'cloud-storage-path/profile.jpg', required: false })
  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @ApiProperty({ example: 'https://.../hero.jpg', required: false })
  @IsOptional()
  @IsString()
  heroImage?: string;

  @ApiProperty({ example: 'Whisky enthusiast from Scotland', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ enum: ExperienceLevel, required: false })
  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;
}