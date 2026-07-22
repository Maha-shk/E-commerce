import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: 'name@institution.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456', description: '6-digit code sent by email' })
  @IsString()
  @Length(6, 6, { message: 'The code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'The code must contain digits only' })
  code!: string;
}

export class ResendOtpDto {
  @ApiProperty({ example: 'name@institution.com' })
  @IsEmail()
  email!: string;
}
