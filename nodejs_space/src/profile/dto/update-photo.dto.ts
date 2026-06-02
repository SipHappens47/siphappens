import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePhotoDto {
  @ApiProperty({ example: 'cloud-storage-path/profile.jpg' })
  @IsString()
  profilePhoto: string;
}