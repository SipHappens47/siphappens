import { IsIn, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReportDto {
  @ApiProperty({ example: 'pour', enum: ['pour', 'user'] })
  @IsIn(['pour', 'user'])
  targetType: 'pour' | 'user';

  @ApiProperty({ example: 'uuid-of-pour-or-user' })
  @IsString()
  targetId: string;

  @ApiProperty({ example: 'Offensive content' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason: string;
}
