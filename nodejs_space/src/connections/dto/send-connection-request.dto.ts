import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendConnectionRequestDto {
  @ApiProperty({ 
    example: 'friend@example.com',
    description: 'User name or email address'
  })
  @IsString()
  @IsNotEmpty()
  receiverEmail: string;
}
