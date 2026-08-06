import { ApiProperty } from '@nestjs/swagger';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Arthur Morgan' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ example: 'name@institution.com' })
  @IsEmail({}, { message: 'A valid email address is required' })
  email!: string;

  @ApiProperty({ example: 'StrongPass123!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one lowercase letter, one uppercase letter, and one number',
  })
  password!: string;

  @ApiProperty({
    example: true,
    description: 'Acceptance of the membership terms. Recorded as User.termsAcceptedAt.',
  })
  @IsBoolean()
  // @IsBoolean() alone would accept `false`, silently creating an account with
  // no consent. Since the timestamp is now persisted, require actual acceptance.
  @Equals(true, { message: 'You must accept the membership terms to create an account' })
  terms!: boolean;
}
