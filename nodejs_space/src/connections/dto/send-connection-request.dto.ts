import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendConnectionRequestDto {
  @ApiProperty({ 
    example: 'Jane Sipper',
    description: 'Exact user name (field name kept for older app versions; emails are not looked up)'
  })
  @IsString()
  @IsNotEmpty()
  receiverEmail: string;
}
