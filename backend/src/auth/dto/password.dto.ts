import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Shared password rule so every password entry point validates identically. */
const StrongPassword = () =>
  Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one lowercase letter, one uppercase letter, and one number',
  });

export class ForgotPasswordDto {
  @ApiProperty({ example: 'name@institution.com' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'name@institution.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456', description: '6-digit code sent by email' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'The code must contain digits only' })
  code!: string;

  @ApiProperty({ example: 'NewStrongPass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @StrongPassword()
  newPassword!: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Current password is required' })
  currentPassword!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @StrongPassword()
  newPassword!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'The refresh token issued at login' })
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}
