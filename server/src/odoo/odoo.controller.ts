import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from './guards/tenant.guard';
import type { OdooConfig } from './guards/tenant.guard';
import { Permissions } from '../auth/decorators/roles.decorator';
import { OdooTenantConfig } from './decorators/odoo-config.decorator';
import { OdooService } from './odoo.service';
import { OdooQueryDto } from './dto/odoo-query.dto';

const VALID_DOMAINS = [
  'sales', 'customers', 'products', 'crm', 'stock',
  'invoices', 'purchases', 'employees', 'projects', 'kpis',
] as const;

@ApiTags('odoo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('odoo')
export class OdooController {
  constructor(private readonly odooService: OdooService) {}

  @Post('chat')
  @Permissions('use:ai')
  @ApiOperation({
    summary: 'Odoo AI chat',
    description:
      'Ask a natural-language question about Odoo data. ' +
      'The tenant is resolved automatically from the authenticated user. ' +
      'Requires `use:ai` permission.',
  })
  @ApiResponse({
    status: 201,
    schema: {
      example: {
        answer: 'Hi ha 12 factures pendents per un total de 45.600 €.',
        intent: 'invoices',
        confidence: 0.96,
        tenant: 'Acme Corp',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires use:ai or no tenant assigned' })
  @ApiResponse({ status: 503, description: 'Odoo unreachable' })
  chat(
    @OdooTenantConfig() cfg: OdooConfig,
    @Body() dto: OdooQueryDto,
  ) {
    return this.odooService.chat(cfg, dto);
  }

  @Get('health')
  @Permissions('use:ai')
  @ApiOperation({
    summary: 'Odoo connectivity check',
    description: 'Verifies the tenant Odoo connection is reachable.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        status: 'ok',
        odoo_connected: true,
        odoo_url: 'http://localhost:8069',
        tenant: 'Acme Corp',
      },
    },
  })
  health(@OdooTenantConfig() cfg: OdooConfig) {
    return this.odooService.health(cfg);
  }

  @Get('data/:domain')
  @Permissions('use:ai')
  @ApiOperation({
    summary: 'Raw Odoo data by domain',
    description: `Fetch live records from the tenant's Odoo without AI processing.\nValid domains: **${VALID_DOMAINS.join(', ')}**`,
  })
  @ApiParam({ name: 'domain', enum: VALID_DOMAINS })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Raw records from Odoo' })
  @ApiResponse({ status: 404, description: 'Unknown domain' })
  @ApiResponse({ status: 503, description: 'Odoo unreachable' })
  rawData(
    @OdooTenantConfig() cfg: OdooConfig,
    @Param('domain') domain: string,
    @Query('limit') limit?: number,
  ) {
    if (!(VALID_DOMAINS as readonly string[]).includes(domain)) {
      throw new NotFoundException(
        `Unknown domain "${domain}". Valid: ${VALID_DOMAINS.join(', ')}`,
      );
    }
    return this.odooService.rawData(cfg, domain, limit);
  }
}
