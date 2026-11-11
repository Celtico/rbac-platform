import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { OdooConfig } from './guards/tenant.guard';
import {
  isSimulatedOdooUrl,
  SimulatedOdooService,
} from './simulated/simulated-odoo.service';

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
 *
 * A tenant whose Odoo URL is `simulated` never leaves the process: its calls
 * are answered by `SimulatedOdooService` from the app's own database.
 */
@Injectable()
export class OdooClientService {
  private readonly logger = new Logger(OdooClientService.name);
  /** UID cache: key = `url|db|user` */
  private readonly uidCache = new Map<string, number>();

  constructor(private readonly simulated: SimulatedOdooService) {}

  // ---------------------------------------------------------------------------
  // JSON-RPC core
  // ---------------------------------------------------------------------------

  private cacheKey(cfg: OdooConfig) {
    return `${cfg.url}|${cfg.db}|${cfg.user}`;
  }

  private async rpc<T>(cfg: OdooConfig, payload: RpcPayload): Promise<T> {
    if (isSimulatedOdooUrl(cfg.url)) {
      return this.simulated.rpc<T>(payload);
    }

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

  /** Aggregate server-side with Odoo's read_group (avoids pulling raw rows). */
  async readGroup<T = Record<string, unknown>>(
    cfg: OdooConfig,
    model: string,
    domain: unknown[][],
    fields: string[],
    groupby: string[],
    kwargs: Record<string, unknown> = {},
  ): Promise<T[]> {
    const uid = await this.getUid(cfg);
    return this.rpc<T[]>(cfg, {
      service: 'object',
      method: 'execute_kw',
      args: [
        cfg.db,
        uid,
        cfg.password,
        model,
        'read_group',
        [domain, fields, groupby],
        kwargs,
      ],
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
      [
        'name',
        'partner_id',
        'expected_revenue',
        'probability',
        'stage_id',
        'user_id',
      ],
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
      [
        ['move_type', '=', 'out_invoice'],
        ['state', '!=', 'cancel'],
      ],
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
        safe(
          this.count(cfg, 'sale.order', [['state', 'in', ['sale', 'done']]]),
        ),
        safe(this.count(cfg, 'res.partner', [['customer_rank', '>', 0]])),
        safe(this.count(cfg, 'product.template', [['sale_ok', '=', true]])),
        safe(
          this.count(cfg, 'crm.lead', [
            ['type', '=', 'opportunity'],
            ['probability', '<', 100],
          ]),
        ),
        safe(
          this.count(cfg, 'account.move', [
            ['move_type', '=', 'out_invoice'],
            ['payment_state', 'in', ['not_paid', 'partial']],
            ['state', '=', 'posted'],
          ]),
        ),
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

  async create(
    cfg: OdooConfig,
    model: string,
    values: Record<string, unknown>,
  ): Promise<number> {
    const uid = await this.getUid(cfg);
    return this.rpc<number>(cfg, {
      service: 'object',
      method: 'execute_kw',
      args: [cfg.db, uid, cfg.password, model, 'create', [values]],
    });
  }

  async write(
    cfg: OdooConfig,
    model: string,
    ids: number[],
    values: Record<string, unknown>,
  ): Promise<boolean> {
    const uid = await this.getUid(cfg);
    return this.rpc<boolean>(cfg, {
      service: 'object',
      method: 'execute_kw',
      args: [cfg.db, uid, cfg.password, model, 'write', [ids, values]],
    });
  }

  async callMethod(
    cfg: OdooConfig,
    model: string,
    method: string,
    ids: number[],
  ): Promise<unknown> {
    const uid = await this.getUid(cfg);
    return this.rpc<unknown>(cfg, {
      service: 'object',
      method: 'execute_kw',
      args: [cfg.db, uid, cfg.password, model, method, [ids]],
    });
  }

  async findPartnerByName(cfg: OdooConfig, name: string) {
    const results = await this.searchRead<{ id: number; name: string }>(
      cfg,
      'res.partner',
      [['name', 'ilike', name]],
      ['id', 'name'],
      5,
    );
    return results[0] ?? null;
  }

  async findProductByName(cfg: OdooConfig, name: string) {
    const results = await this.searchRead<{
      id: number;
      name: string;
      list_price: number;
    }>(
      cfg,
      'product.product',
      [
        ['name', 'ilike', name],
        ['sale_ok', '=', true],
      ],
      ['id', 'name', 'list_price'],
      5,
    );
    return results[0] ?? null;
  }

  async getMostSoldProduct(cfg: OdooConfig) {
    const domain = [['order_id.state', 'in', ['sale', 'done']]];

    // Efficient path: let Odoo aggregate and sort, return only the top group.
    try {
      const groups = await this.readGroup<{
        product_id: [number, string];
        product_uom_qty: number;
      }>(cfg, 'sale.order.line', domain, ['product_uom_qty'], ['product_id'], {
        orderby: 'product_uom_qty desc',
        limit: 1,
        lazy: false,
      });
      const top = groups[0];
      if (top?.product_id) {
        return {
          id: top.product_id[0],
          name: top.product_id[1],
          qty: top.product_uom_qty ?? 0,
        };
      }
      return null;
    } catch {
      // Fallback: bounded fetch + aggregate in JS (keeps working if the Odoo
      // version/permissions reject read_group with this grouping).
      const lines = await this.searchRead<{
        product_id: [number, string];
        product_uom_qty: number;
      }>(
        cfg,
        'sale.order.line',
        domain,
        ['product_id', 'product_uom_qty'],
        500,
      );

      const totals: Record<number, { id: number; name: string; qty: number }> =
        {};
      for (const line of lines) {
        if (!line.product_id) continue;
        const [pid, pname] = line.product_id;
        if (!totals[pid]) totals[pid] = { id: pid, name: pname, qty: 0 };
        totals[pid].qty += line.product_uom_qty ?? 0;
      }
      const sorted = Object.values(totals).sort((a, b) => b.qty - a.qty);
      return sorted[0] ?? null;
    }
  }

  async createInvoice(
    cfg: OdooConfig,
    partnerName: string,
    lines: { description: string; quantity: number; price: number }[],
  ): Promise<{ id: number; name: string }> {
    // 1. Resolve partner
    const partner = await this.findPartnerByName(cfg, partnerName);
    if (!partner) {
      throw new Error(`No s'ha trobat cap client amb el nom "${partnerName}"`);
    }

    // 2. Build invoice lines
    const invoiceLines = lines.map((l) => [
      0,
      0,
      {
        name: l.description,
        quantity: l.quantity,
        price_unit: l.price,
      },
    ]);

    // 3. Create invoice
    const invoiceId = await this.create(cfg, 'account.move', {
      move_type: 'out_invoice',
      partner_id: partner.id,
      invoice_line_ids: invoiceLines,
    });

    // 4. Confirm (post) the invoice
    await this.callMethod(cfg, 'account.move', 'action_post', [invoiceId]);

    // 5. Get the invoice number
    const invoices = await this.searchRead<{ id: number; name: string }>(
      cfg,
      'account.move',
      [['id', '=', invoiceId]],
      ['id', 'name'],
      1,
    );

    return invoices[0] ?? { id: invoiceId, name: `INV/${invoiceId}` };
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
