import { IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ type: [Number], required: false })
  @IsOptional()
  @IsArray()
  permissionIds?: number[];
}
