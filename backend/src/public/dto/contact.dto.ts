import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class ContactFormDto {
  @ApiProperty({ example: 'John Doe', description: 'Sender full name' })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name!: string;

  @ApiProperty({ example: 'john@example.com', description: 'Sender email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(255, { message: 'Email must not exceed 255 characters' })
  email!: string;

  @ApiProperty({ example: 'General Inquiry', description: 'Subject of the message' })
  @IsNotEmpty({ message: 'Subject is required' })
  @IsString()
  @MinLength(3, { message: 'Subject must be at least 3 characters' })
  @MaxLength(200, { message: 'Subject must not exceed 200 characters' })
  subject!: string;

  @ApiProperty({
    example: 'Hi, I have a question about your products...',
    description: 'Message content'
  })
  @IsNotEmpty({ message: 'Message is required' })
  @IsString()
  @MinLength(10, { message: 'Message must be at least 10 characters' })
  @MaxLength(4000, { message: 'Message must not exceed 4000 characters' })
  message!: string;
}
