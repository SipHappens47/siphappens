import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecognizeBottleDto {
  @ApiProperty({ 
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    description: 'Base64 encoded image or data URL'
  })
  @IsString()
  image: string;
}