import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Self-service profile update for any signed-in user (customers included).
 *
 * Deliberately narrower than the admin `UpdateProfileDto`: `email` is omitted
 * because changing it has to invalidate `emailVerified` and re-run the OTP
 * flow, and `role`/`status` are never self-assignable. Everything here is
 * optional so the client can PATCH a single field.
 */
export class UpdateMeDto {
  @ApiPropertyOptional({ example: 'Arthur Morgan' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName?: string;

  @ApiPropertyOptional({ example: '+353 87 123 4567' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({ description: 'URL of the profile picture' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatarUrl?: string;
}
