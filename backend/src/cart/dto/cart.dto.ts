import { IsString, IsOptional } from 'class-validator';

export class MergeCartDto {
  @IsString()
  sessionId: string;
}

export class CartCountResponseDto {
  count: number;
}
