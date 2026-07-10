import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolveReportDto {
  @ApiProperty({
    example: 'delete_content',
    enum: ['dismiss', 'delete_content', 'ban_user'],
    description:
      'dismiss = no action; delete_content = remove the reported pour; ban_user = delete the reported/owning user account',
  })
  @IsIn(['dismiss', 'delete_content', 'ban_user'])
  action: 'dismiss' | 'delete_content' | 'ban_user';
}
