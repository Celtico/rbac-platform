import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OdooSimRecord } from './odoo-sim-record.entity';
import {
  matchesDomain,
  OdooRecord,
  pickFields,
  readGroup,
  sortRecords,
} from './simulated-odoo.domain';
import {
  buildSimulatedDataset,
  invoiceName,
  odooDate,
  SIMULATED_VAT,
} from './simulated-odoo.seed';

/** Tenant URL that selects the simulated Odoo instead of a real instance. */
export const SIMULATED_ODOO_URL = 'simulated';

/** `true` when a tenant's Odoo URL points at the simulated Odoo. */
export function isSimulatedOdooUrl(url: string | undefined | null): boolean {
  return (url ?? '').trim().toLowerCase().startsWith(SIMULATED_ODOO_URL);
}

/** The JSON-RPC call `OdooClientService` would have sent to Odoo. */
export interface OdooRpcPayload {
  service: string;
  method: string;
  args: unknown[];
}

/** `product.template` and `product.product` are the same records here. */
const MODEL_ALIASES: Record<string, string> = {
  'product.template': 'product.product',
};

interface InvoiceLineValues {
  name?: string;
  quantity?: number;
  price_unit?: number;
}

/**
 * A stand-in for an Odoo server, backed by the app's own SQLite database.
 *
 * It answers the same JSON-RPC calls `OdooClientService` makes (`authenticate`
 * and `execute_kw` with `search_read`, `search_count`, `read_group`, `create`,
 * `write` and `action_post`), so everything above the client — the dashboard,
 * the Odoo manager, the chat orchestrator and invoice creation — works
 * unchanged without an Odoo instance. A tenant uses it when its Odoo URL is
 * `simulated`.
 *
 * It is a demo, not an ERP: there is no accounting behind an invoice, only the
 * fields the app reads back.
 */
@Injectable()
export class SimulatedOdooService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SimulatedOdooService.name);

  constructor(
    @InjectRepository(OdooSimRecord)
    private readonly repo: Repository<OdooSimRecord>,
  ) {}

  /** Seeds the demo dataset the first time the table is empty. */
  async onApplicationBootstrap() {
    if ((await this.repo.count()) > 0) return;
    const dataset = buildSimulatedDataset(new Date());
    const rows: Partial<OdooSimRecord>[] = [];
    for (const [model, records] of Object.entries(dataset)) {
      for (const { id, ...data } of records) {
        rows.push({ model, recordId: id, data });
      }
    }
    await this.repo.save(rows, { chunk: 100 });
    this.logger.log(
      `Seeded the simulated Odoo with ${rows.length} demo records.`,
    );
  }

  /** Entry point: resolves one JSON-RPC payload. */
  async rpc<T>(payload: OdooRpcPayload): Promise<T> {
    if (payload.service === 'common' && payload.method === 'authenticate') {
      return 1 as T; // any credentials are accepted: uid 1
    }
    if (payload.service === 'object' && payload.method === 'execute_kw') {
      const [, , , model, method, args, kwargs] = payload.args as [
        string,
        number,
        string,
        string,
        string,
        unknown[],
        Record<string, unknown> | undefined,
      ];
      return (await this.execute(model, method, args ?? [], kwargs ?? {})) as T;
    }
    throw this.unsupported(`${payload.service}.${payload.method}`);
  }

  private unsupported(what: string) {
    return new ServiceUnavailableException(
      `Odoo RPC error: the simulated Odoo does not implement ${what}`,
    );
  }

  private async execute(
    rawModel: string,
    method: string,
    args: unknown[],
    kwargs: Record<string, unknown>,
  ): Promise<unknown> {
    const model = MODEL_ALIASES[rawModel] ?? rawModel;
    switch (method) {
      case 'search_read': {
        const records = await this.search(model, (args[0] as unknown[]) ?? []);
        const order = typeof kwargs.order === 'string' ? kwargs.order : '';
        const sorted = sortRecords(records, order);
        const limit = Number(kwargs.limit) || sorted.length;
        const fields = (kwargs.fields as string[] | undefined) ?? [];
        return sorted.slice(0, limit).map((r) => pickFields(r, fields));
      }
      case 'search_count':
        return (await this.search(model, (args[0] as unknown[]) ?? [])).length;
      case 'read_group': {
        const [domain, fields, groupby] = args as [
          unknown[],
          string[],
          string[],
        ];
        if (groupby.length !== 1)
          throw this.unsupported('read_group on several fields');
        return readGroup(
          await this.search(model, domain ?? []),
          fields,
          groupby[0],
          {
            orderby: kwargs.orderby as string | undefined,
            limit: Number(kwargs.limit) || undefined,
          },
        );
      }
      case 'create':
        return this.create(model, args[0] as Record<string, unknown>);
      case 'write': {
        const [ids, values] = args as [number[], Record<string, unknown>];
        await this.update(model, ids, () => values);
        return true;
      }
      case 'action_post':
        return this.postInvoices(model, args[0] as number[]);
      default:
        throw this.unsupported(`${rawModel}.${method}`);
    }
  }

  private toRecord(row: OdooSimRecord): OdooRecord {
    return { ...row.data, id: row.recordId };
  }

  private async records(model: string): Promise<OdooRecord[]> {
    const rows = await this.repo.find({
      where: { model },
      order: { recordId: 'ASC' },
    });
    return rows.map((row) => this.toRecord(row));
  }

  /** Records of `model` that satisfy an Odoo search domain. */
  private async search(
    model: string,
    domain: unknown[],
  ): Promise<OdooRecord[]> {
    const records = await this.records(model);
    if (domain.length === 0) return records;

    // Dotted fields (`order_id.state`) need the related models in memory.
    const related = new Map<string, Map<number, OdooRecord>>();
    for (const leaf of domain) {
      if (!Array.isArray(leaf) || !String(leaf[0]).includes('.')) continue;
      for (const target of ['sale.order', 'res.partner', 'product.product']) {
        if (!related.has(target)) {
          related.set(
            target,
            new Map((await this.records(target)).map((r) => [r.id, r])),
          );
        }
      }
    }
    const lookup = (target: string, id: number) => related.get(target)?.get(id);

    try {
      return records.filter((r) => matchesDomain(model, r, domain, lookup));
    } catch (err) {
      throw new ServiceUnavailableException(
        `Odoo RPC error: ${(err as Error).message}`,
      );
    }
  }

  private async nextId(model: string): Promise<number> {
    const last = await this.repo.findOne({
      where: { model },
      order: { recordId: 'DESC' },
    });
    return (last?.recordId ?? 0) + 1;
  }

  private async create(
    model: string,
    values: Record<string, unknown>,
  ): Promise<number> {
    const recordId = await this.nextId(model);
    const data =
      model === 'account.move'
        ? await this.draftInvoice(values)
        : { ...values };
    await this.repo.save({ model, recordId, data });
    return recordId;
  }

  /** A draft customer invoice out of `account.move` create values. */
  private async draftInvoice(
    values: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const partnerId = Number(values.partner_id);
    const partner = (await this.records('res.partner')).find(
      (p) => p.id === partnerId,
    );
    if (!partner) {
      throw new ServiceUnavailableException(
        `Odoo RPC error: partner ${partnerId} does not exist`,
      );
    }
    // One2many commands: [0, 0, values] creates a line.
    const commands = (values.invoice_line_ids as unknown[][] | undefined) ?? [];
    const lines = commands
      .filter((c) => Array.isArray(c) && c[0] === 0)
      .map((c) => c[2] as InvoiceLineValues)
      .map((l) => ({
        name: String(l.name ?? ''),
        quantity: Number(l.quantity ?? 1),
        price_unit: Number(l.price_unit ?? 0),
      }));
    const untaxed = lines.reduce(
      (sum, l) => sum + l.quantity * l.price_unit,
      0,
    );
    return {
      name: '/',
      partner_id: [partner.id, partner.name],
      move_type: values.move_type ?? 'out_invoice',
      state: 'draft',
      payment_state: 'not_paid',
      invoice_date: false,
      amount_untaxed: Math.round(untaxed * 100) / 100,
      amount_total: Math.round(untaxed * (1 + SIMULATED_VAT) * 100) / 100,
      invoice_lines: lines,
    };
  }

  private async update(
    model: string,
    ids: number[],
    change: (record: OdooRecord) => Record<string, unknown>,
  ): Promise<void> {
    for (const recordId of ids) {
      const row = await this.repo.findOne({ where: { model, recordId } });
      if (!row) {
        throw new ServiceUnavailableException(
          `Odoo RPC error: ${model} record ${recordId} does not exist`,
        );
      }
      row.data = { ...row.data, ...change(this.toRecord(row)) };
      await this.repo.save(row);
    }
  }

  /** Posts draft invoices: gives each its number and today's date. */
  private async postInvoices(model: string, ids: number[]): Promise<boolean> {
    if (model !== 'account.move')
      throw this.unsupported(`${model}.action_post`);
    const today = new Date();
    const posted = (await this.records(model)).filter(
      (r) => r.state === 'posted',
    ).length;
    let sequence = posted;
    await this.update(model, ids, (record) =>
      record.state === 'posted'
        ? {}
        : {
            state: 'posted',
            name: invoiceName(today.getUTCFullYear(), ++sequence),
            invoice_date: record.invoice_date || odooDate(today),
          },
    );
    return true;
  }
}
