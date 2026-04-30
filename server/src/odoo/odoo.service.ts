import { Injectable, NotFoundException } from '@nestjs/common';
import { OdooClientService } from './odoo-client.service';
import { OdooOrchestratorService } from './odoo-orchestrator.service';
import { OdooQueryDto } from './dto/odoo-query.dto';
import { OdooConfig } from './guards/tenant.guard';

const VALID_DOMAINS = [
  'sales', 'customers', 'products', 'crm', 'stock',
  'invoices', 'purchases', 'employees', 'projects', 'kpis',
];

@Injectable()
export class OdooService {
  constructor(
    private readonly client: OdooClientService,
    private readonly orchestrator: OdooOrchestratorService,
  ) {}

  chat(cfg: OdooConfig, dto: OdooQueryDto) {
    return this.orchestrator.query(cfg, dto.question, dto.include_raw_data ?? false);
  }

  async health(cfg: OdooConfig) {
    const connected = await this.client.isConnected(cfg);
    return {
      status: 'ok',
      odoo_connected: connected,
      odoo_url: cfg.url,
      tenant: cfg.tenantName ?? 'default',
    };
  }

  rawData(cfg: OdooConfig, domain: string, limit = 10) {
    if (!VALID_DOMAINS.includes(domain)) {
      throw new NotFoundException(
        `Unknown domain "${domain}". Valid: ${VALID_DOMAINS.join(', ')}`,
      );
    }
    return this.orchestrator.getRawData(cfg, domain, limit);
  }
}
