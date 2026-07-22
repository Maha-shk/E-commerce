import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ConversationQueryDto extends PaginationQueryDto {}

export class SendMessageDto {
  @ApiProperty({ example: 'Hello Elena! Let me check that for you right away.' })
  @IsString()
  @MinLength(1, { message: 'Message text cannot be empty' })
  @MaxLength(4000)
  text!: string;
}

export class StartConversationDto {
  @ApiProperty({ description: 'Customer the conversation belongs to' })
  @IsString()
  customerId!: string;

  @ApiPropertyOptional({ description: 'Optional first message from the admin' })
  @IsString()
  @IsOptional()
  @MaxLength(4000)
  text?: string;
}
