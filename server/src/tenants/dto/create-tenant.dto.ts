import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUrl, MinLength } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'http://localhost:8069' })
  @IsString()
  odooUrl: string;

  @ApiProperty({ example: 'odoo_demo' })
  @IsString()
  odooDb: string;

  @ApiProperty({ example: 'admin' })
  @IsString()
  odooUser: string;

  @ApiProperty({ example: 'admin' })
  @IsString()
  @MinLength(1)
  odooPassword: string;
}
