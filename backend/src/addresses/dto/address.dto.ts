import { IsArray, IsBoolean, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @IsArray()
  @IsString({ each: true })
  lines: string[];

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lines?: string[];

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
