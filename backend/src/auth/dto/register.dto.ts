import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MaxLength, MinLength, IsBoolean } from 'class-validator';

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

  @ApiProperty({ example: true })
  @IsBoolean()
  terms!: boolean;
}
