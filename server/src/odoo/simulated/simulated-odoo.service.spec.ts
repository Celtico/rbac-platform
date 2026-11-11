import { DataSource } from 'typeorm';
import { OdooClientService } from '../odoo-client.service';
import { OdooConfig } from '../guards/tenant.guard';
import { SimulatedOdoo1794420000000 } from '../../migrations/1794420000000-SimulatedOdoo';
import { OdooSimRecord } from './odoo-sim-record.entity';
import {
  isSimulatedOdooUrl,
  SimulatedOdooService,
} from './simulated-odoo.service';

const cfg: OdooConfig = {
  url: 'simulated',
  db: 'demo',
  user: 'admin',
  password: 'admin',
  tenantName: 'Default',
};

type Sale = {
  id: number;
  name: string;
  partner_id: [number, string];
  amount_total: number;
  date_order: string;
  state: string;
};
type Invoice = {
  id: number;
  name: string;
  partner_id: [number, string];
  amount_total: number;
  invoice_date: string;
  payment_state: string;
};

describe('SimulatedOdooService behind OdooClientService', () => {
  let dataSource: DataSource;
  let simulated: SimulatedOdooService;
  let client: OdooClientService;

  beforeEach(async () => {
    // The table comes from the migration, not from `synchronize`, so the test
    // also proves the migration matches the entity.
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [OdooSimRecord],
      migrations: [SimulatedOdoo1794420000000],
      migrationsRun: true,
    });
    await dataSource.initialize();
    simulated = new SimulatedOdooService(
      dataSource.getRepository(OdooSimRecord),
    );
    await simulated.onApplicationBootstrap();
    client = new OdooClientService(simulated);
  });

  afterEach(() => dataSource.destroy());

  it('recognises the simulated URL', () => {
    expect(isSimulatedOdooUrl('simulated')).toBe(true);
    expect(isSimulatedOdooUrl(' Simulated://demo ')).toBe(true);
    expect(isSimulatedOdooUrl('http://localhost:8069')).toBe(false);
    expect(isSimulatedOdooUrl(undefined)).toBe(false);
  });

  it('seeds once', async () => {
    const before = await dataSource.getRepository(OdooSimRecord).count();
    expect(before).toBeGreaterThan(100);
    await simulated.onApplicationBootstrap();
    expect(await dataSource.getRepository(OdooSimRecord).count()).toBe(before);
  });

  it('answers the connectivity check without any network', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    expect(await client.isConnected(cfg)).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('returns confirmed sales, newest first, with the partner as [id, name]', async () => {
    const sales = (await client.getSales(cfg, 5)) as Sale[];
    expect(sales).toHaveLength(5);
    expect(Object.keys(sales[0]).sort()).toEqual([
      'amount_total',
      'date_order',
      'id',
      'name',
      'partner_id',
      'state',
    ]);
    expect(sales.every((s) => ['sale', 'done'].includes(s.state))).toBe(true);
    expect(typeof sales[0].partner_id[0]).toBe('number');
    expect(typeof sales[0].partner_id[1]).toBe('string');
    const dates = sales.map((s) => s.date_order);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('serves every domain the dashboard and the chat read', async () => {
    const customers = (await client.getCustomers(cfg, 3)) as {
      customer_rank: number;
      country_id: [number, string];
    }[];
    expect(customers.map((c) => c.customer_rank)).toEqual([14, 13, 12]);
    expect(customers[0].country_id[1]).toBe('Espanya');

    const products = (await client.getProducts(cfg, 50)) as {
      name: string;
      categ_id: [number, string];
    }[];
    expect(products).toHaveLength(16);
    expect(products.map((p) => p.name)).toEqual(
      [...products.map((p) => p.name)].sort((a, b) => a.localeCompare(b)),
    );

    const stock = (await client.getStock(cfg, 50)) as {
      qty_available: number;
    }[];
    expect(stock).toHaveLength(13); // services have no stock
    expect(stock[0].qty_available).toBeLessThanOrEqual(stock[1].qty_available);

    const leads = (await client.getCrmLeads(cfg, 3)) as {
      expected_revenue: number;
      stage_id: [number, string];
    }[];
    expect(leads.map((l) => l.expected_revenue)).toEqual([68000, 54000, 46000]);

    expect(await client.getPurchases(cfg, 50)).toHaveLength(14);
    expect(await client.getEmployees(cfg, 50)).toHaveLength(14);
    expect(await client.getProjects(cfg, 50)).toHaveLength(6);
  });

  it('counts the KPIs', async () => {
    const kpis = await client.getKpis(cfg);
    expect(kpis).toMatchObject({
      sales: 44,
      customers: 14,
      products: 16,
      open_opportunities: 11,
      employees: 14,
    });
    expect(kpis.unpaid_invoices).toBeGreaterThan(0);
  });

  it('finds the most sold product with read_group over the order lines', async () => {
    const lines = await client.searchRead<{
      product_id: [number, string];
      product_uom_qty: number;
    }>(cfg, 'sale.order.line', [], ['product_id', 'product_uom_qty'], 1000);
    const totals = new Map<string, number>();
    for (const l of lines)
      totals.set(
        l.product_id[1],
        (totals.get(l.product_id[1]) ?? 0) + l.product_uom_qty,
      );
    const [expectedName, expectedQty] = [...totals.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0];

    const top = await client.getMostSoldProduct(cfg);
    expect(top).toMatchObject({ name: expectedName, qty: expectedQty });
  });

  it('finds partners and products by a fragment of their name', async () => {
    expect((await client.findPartnerByName(cfg, 'vall d'))?.name).toBe(
      "Hotel Vall d'Aran",
    );
    expect(await client.findProductByName(cfg, 'prestatgeria')).toMatchObject({
      name: 'Prestatgeria modular',
      list_price: 320,
    });
    expect(await client.findPartnerByName(cfg, 'no existeix')).toBeNull();
  });

  it('creates and posts an invoice that then shows up as unpaid', async () => {
    const before = await client.getKpis(cfg);
    const invoice = await client.createInvoice(cfg, "Hotel Vall d'Aran", [
      { description: 'Prestatgeria modular', quantity: 3, price: 320 },
      { description: 'Muntatge a domicili', quantity: 2, price: 60 },
    ]);
    expect(invoice.name).toMatch(/^FAC\/\d{4}\/\d{5}$/);

    const [latest] = (await client.getInvoices(cfg, 1)) as Invoice[];
    expect(latest).toMatchObject({
      id: invoice.id,
      name: invoice.name,
      payment_state: 'not_paid',
    });
    expect(latest.partner_id[1]).toBe("Hotel Vall d'Aran");
    expect(latest.amount_total).toBeCloseTo((3 * 320 + 2 * 60) * 1.21, 2);
    expect(latest.invoice_date).toBe(new Date().toISOString().slice(0, 10));

    const names = ((await client.getInvoices(cfg, 500)) as Invoice[]).map(
      (i) => i.name,
    );
    expect(new Set(names).size).toBe(names.length);
    expect((await client.getKpis(cfg)).unpaid_invoices).toBe(
      (before.unpaid_invoices ?? 0) + 1,
    );
  });

  it('refuses an invoice for a customer that does not exist', async () => {
    await expect(
      client.createInvoice(cfg, 'Client Fantasma', [
        { description: 'x', quantity: 1, price: 1 },
      ]),
    ).rejects.toThrow(/No s'ha trobat cap client/);
  });

  it('reports what it does not implement as an Odoo RPC error', async () => {
    await expect(
      client.callMethod(cfg, 'sale.order', 'action_confirm', [1]),
    ).rejects.toThrow(/does not implement/);
  });
});
