import { PartialType } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ description: 'Assign user to a tenant', example: 1 })
  @IsOptional()
  @IsNumber()
  tenantId?: number;
}
