import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { OdooConfig } from './guards/tenant.guard';

interface RpcPayload {
  service: string;
  method: string;
  args: unknown[];
}

/**
 * Stateless JSON-RPC client for Odoo.
 * Every public method accepts an OdooConfig so the same service instance
 * can talk to different Odoo tenants within the same request cycle.
 * UIDs are cached per (url|db|user) key to avoid re-authenticating.
 */
@Injectable()
export class OdooClientService {
  private readonly logger = new Logger(OdooClientService.name);
  /** UID cache: key = `url|db|user` */
  private readonly uidCache = new Map<string, number>();

  // ---------------------------------------------------------------------------
  // JSON-RPC core
  // ---------------------------------------------------------------------------

  private cacheKey(cfg: OdooConfig) {
    return `${cfg.url}|${cfg.db}|${cfg.user}`;
  }

  private async rpc<T>(cfg: OdooConfig, payload: RpcPayload): Promise<T> {
    const body = {
      jsonrpc: '2.0',
      method: 'call',
      id: Date.now(),
      params: payload,
    };

    const res = await fetch(`${cfg.url}/jsonrpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    }).catch((err: Error) => {
      throw new ServiceUnavailableException(
        `Odoo unreachable at ${cfg.url}: ${err.message}`,
      );
    });

    const json = (await res.json()) as {
      result?: T;
      error?: { message: string };
    };

    if (json.error) {
      throw new ServiceUnavailableException(
        `Odoo RPC error: ${json.error.message}`,
      );
    }
    return json.result as T;
  }

  async getUid(cfg: OdooConfig): Promise<number> {
    const key = this.cacheKey(cfg);
    const cached = this.uidCache.get(key);
    if (cached) return cached;

    const uid = await this.rpc<number>(cfg, {
      service: 'common',
      method: 'authenticate',
      args: [cfg.db, cfg.user, cfg.password, {}],
    });

    if (!uid) {
      throw new ServiceUnavailableException(
        'Odoo authentication failed — check tenant credentials',
      );
    }

    this.uidCache.set(key, uid);
    this.logger.debug(`Authenticated uid=${uid} for ${cfg.url} (db=${cfg.db})`);
    return uid;
  }

  async searchRead<T = Record<string, unknown>>(
    cfg: OdooConfig,
    model: string,
    domain: unknown[][],
    fields: string[],
    limit = 20,
    order = '',
  ): Promise<T[]> {
    const uid = await this.getUid(cfg);
    const kwargs: Record<string, unknown> = { fields, limit };
    if (order) kwargs.order = order;
    return this.rpc<T[]>(cfg, {
      service: 'object',
      method: 'execute_kw',
      args: [cfg.db, uid, cfg.password, model, 'search_read', [domain], kwargs],
    });
  }

  async count(
    cfg: OdooConfig,
    model: string,
    domain: unknown[][],
  ): Promise<number> {
    const uid = await this.getUid(cfg);
    return this.rpc<number>(cfg, {
      service: 'object',
      method: 'execute_kw',
      args: [cfg.db, uid, cfg.password, model, 'search_count', [domain]],
    });
  }

  // ---------------------------------------------------------------------------
  // Domain helpers — all accept OdooConfig
  // ---------------------------------------------------------------------------

  getSales(cfg: OdooConfig, limit = 10) {
    return this.searchRead(
      cfg,
      'sale.order',
      [['state', 'in', ['sale', 'done']]],
      ['name', 'partner_id', 'amount_total', 'date_order', 'state'],
      limit,
      'date_order desc',
    );
  }

  getCustomers(cfg: OdooConfig, limit = 10) {
    return this.searchRead(
      cfg,
      'res.partner',
      [['customer_rank', '>', 0]],
      ['name', 'email', 'customer_rank', 'country_id'],
      limit,
      'customer_rank desc',
    );
  }

  getProducts(cfg: OdooConfig, limit = 20) {
    return this.searchRead(
      cfg,
      'product.template',
      [['sale_ok', '=', true]],
      ['name', 'list_price', 'categ_id', 'qty_available'],
      limit,
      'name asc',
    );
  }

  getCrmLeads(cfg: OdooConfig, limit = 10) {
    return this.searchRead(
      cfg,
      'crm.lead',
      [['type', '=', 'opportunity']],
      ['name', 'partner_id', 'expected_revenue', 'probability', 'stage_id', 'user_id'],
      limit,
      'expected_revenue desc',
    );
  }

  getStock(cfg: OdooConfig, limit = 20) {
    return this.searchRead(
      cfg,
      'product.product',
      [['type', '=', 'product']],
      ['name', 'qty_available', 'virtual_available', 'uom_id'],
      limit,
      'qty_available asc',
    );
  }

  getInvoices(cfg: OdooConfig, limit = 10) {
    return this.searchRead(
      cfg,
      'account.move',
      [['move_type', '=', 'out_invoice'], ['state', '!=', 'cancel']],
      ['name', 'partner_id', 'amount_total', 'invoice_date', 'payment_state'],
      limit,
      'invoice_date desc',
    );
  }

  getPurchases(cfg: OdooConfig, limit = 10) {
    return this.searchRead(
      cfg,
      'purchase.order',
      [['state', 'in', ['purchase', 'done']]],
      ['name', 'partner_id', 'amount_total', 'date_order', 'state'],
      limit,
      'date_order desc',
    );
  }

  getEmployees(cfg: OdooConfig, limit = 20) {
    return this.searchRead(
      cfg,
      'hr.employee',
      [['active', '=', true]],
      ['name', 'job_title', 'department_id', 'work_email'],
      limit,
      'name asc',
    );
  }

  getProjects(cfg: OdooConfig, limit = 10) {
    return this.searchRead(
      cfg,
      'project.project',
      [['active', '=', true]],
      ['name', 'user_id', 'task_count', 'date_start', 'date'],
      limit,
    );
  }

  async getKpis(cfg: OdooConfig) {
    /** Counts that may fail if a module (CRM, HR, etc.) is not installed. */
    const safe = (p: Promise<number>) => p.catch(() => null);

    const [sales, customers, products, crm, invoices, employees] =
      await Promise.all([
        safe(this.count(cfg, 'sale.order', [['state', 'in', ['sale', 'done']]])),
        safe(this.count(cfg, 'res.partner', [['customer_rank', '>', 0]])),
        safe(this.count(cfg, 'product.template', [['sale_ok', '=', true]])),
        safe(this.count(cfg, 'crm.lead', [
          ['type', '=', 'opportunity'],
          ['probability', '<', 100],
        ])),
        safe(this.count(cfg, 'account.move', [
          ['move_type', '=', 'out_invoice'],
          ['payment_state', 'in', ['not_paid', 'partial']],
          ['state', '=', 'posted'],
        ])),
        safe(this.count(cfg, 'hr.employee', [['active', '=', true]])),
      ]);

    return {
      sales,
      customers,
      products,
      open_opportunities: crm,
      unpaid_invoices: invoices,
      employees,
    };
  }

  async isConnected(cfg: OdooConfig): Promise<boolean> {
    try {
      await this.getUid(cfg);
      return true;
    } catch {
      return false;
    }
  }
}
