import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class OdooQueryDto {
  @ApiProperty({ example: 'Quantes factures pendents hi ha?' })
  @IsString()
  @IsNotEmpty({ message: 'question must not be empty' })
  question: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  include_raw_data?: boolean;
}
