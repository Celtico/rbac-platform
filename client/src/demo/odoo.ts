import type { DemoDb } from "./db";

/**
 * Odoo simulat: les mateixes consultes que `OdooClientService` fa a l'ERP real
 * per JSON-RPC, resoltes amb SQL sobre les taules `odoo_*`. Els registres
 * tenen la forma que retorna Odoo: `id`, els camps demanats i els many2one
 * com a parella `[id, nom]`.
 */

export const ODOO_DOMAINS = [
  "sales",
  "customers",
  "products",
  "crm",
  "stock",
  "invoices",
  "purchases",
  "employees",
  "projects",
  "kpis",
] as const;
export type OdooDomain = (typeof ODOO_DOMAINS)[number];

export type Many2One = [number, string] | false;
export type OdooRecord = Record<string, unknown>;

export interface OdooKpis {
  sales: number;
  customers: number;
  products: number;
  open_opportunities: number;
  unpaid_invoices: number;
  employees: number;
}

export interface InvoiceLine {
  description: string;
  quantity: number;
  price: number;
}

/** Converteix un id i un nom en el many2one d'Odoo. */
const m2o = (id: unknown, name: unknown): Many2One => (id == null ? false : [Number(id), String(name ?? "")]);

const round2 = (n: number) => Math.round(n * 100) / 100;

export class SimulatedOdoo {
  private readonly db: DemoDb;

  constructor(db: DemoDb) {
    this.db = db;
  }

  getSales(limit = 10): OdooRecord[] {
    return this.db
      .all<OdooRecord>(
        `SELECT o.id, o.name, o.partner_id, p.name AS partner_name, o.amount_total, o.date_order, o.state
           FROM odoo_sale_order o JOIN odoo_partner p ON p.id = o.partner_id
          WHERE o.state IN ('sale', 'done')
          ORDER BY o.date_order DESC LIMIT ?`,
        [limit],
      )
      .map(({ partner_name, ...r }) => ({ ...r, partner_id: m2o(r.partner_id, partner_name) }));
  }

  getCustomers(limit = 10): OdooRecord[] {
    return this.db
      .all<OdooRecord>(
        `SELECT id, name, email, customer_rank, country FROM odoo_partner
          WHERE customer_rank > 0 ORDER BY customer_rank DESC LIMIT ?`,
        [limit],
      )
      .map(({ country, ...r }) => ({ ...r, country_id: m2o(country === "França" ? 75 : 68, country) }));
  }

  getProducts(limit = 20): OdooRecord[] {
    return this.db
      .all<OdooRecord>(
        `SELECT id, name, list_price, category, qty_available FROM odoo_product
          WHERE sale_ok = 1 ORDER BY name ASC LIMIT ?`,
        [limit],
      )
      .map(({ category, ...r }) => ({ ...r, categ_id: m2o(1, category) }));
  }

  getCrmLeads(limit = 10): OdooRecord[] {
    return this.db
      .all<OdooRecord>(
        `SELECT l.id, l.name, l.partner_id, p.name AS partner_name, l.expected_revenue, l.probability, l.stage, l.salesperson
           FROM odoo_lead l LEFT JOIN odoo_partner p ON p.id = l.partner_id
          WHERE l.type = 'opportunity'
          ORDER BY l.expected_revenue DESC LIMIT ?`,
        [limit],
      )
      .map(({ partner_name, stage, salesperson, ...r }) => ({
        ...r,
        partner_id: m2o(r.partner_id, partner_name),
        stage_id: m2o(1, stage),
        user_id: m2o(1, salesperson),
      }));
  }

  getStock(limit = 20): OdooRecord[] {
    return this.db
      .all<OdooRecord>(
        `SELECT id, name, qty_available, virtual_available, uom FROM odoo_product
          WHERE type = 'product' ORDER BY qty_available ASC LIMIT ?`,
        [limit],
      )
      .map(({ uom, ...r }) => ({ ...r, uom_id: m2o(1, uom) }));
  }

  getInvoices(limit = 10): OdooRecord[] {
    return this.db
      .all<OdooRecord>(
        `SELECT i.id, i.name, i.partner_id, p.name AS partner_name, i.amount_total, i.invoice_date, i.payment_state
           FROM odoo_invoice i JOIN odoo_partner p ON p.id = i.partner_id
          WHERE i.move_type = 'out_invoice' AND i.state != 'cancel'
          ORDER BY i.invoice_date DESC, i.id DESC LIMIT ?`,
        [limit],
      )
      .map(({ partner_name, ...r }) => ({ ...r, partner_id: m2o(r.partner_id, partner_name) }));
  }

  getPurchases(limit = 10): OdooRecord[] {
    return this.db
      .all<OdooRecord>(
        `SELECT o.id, o.name, o.partner_id, p.name AS partner_name, o.amount_total, o.date_order, o.state
           FROM odoo_purchase_order o JOIN odoo_partner p ON p.id = o.partner_id
          WHERE o.state IN ('purchase', 'done')
          ORDER BY o.date_order DESC LIMIT ?`,
        [limit],
      )
      .map(({ partner_name, ...r }) => ({ ...r, partner_id: m2o(r.partner_id, partner_name) }));
  }

  getEmployees(limit = 20): OdooRecord[] {
    return this.db
      .all<OdooRecord>(
        `SELECT id, name, job_title, department, work_email FROM odoo_employee
          WHERE active = 1 ORDER BY name ASC LIMIT ?`,
        [limit],
      )
      .map(({ department, ...r }) => ({ ...r, department_id: m2o(1, department) }));
  }

  getProjects(limit = 10): OdooRecord[] {
    return this.db
      .all<OdooRecord>(
        `SELECT id, name, manager, task_count, date_start, date FROM odoo_project
          WHERE active = 1 ORDER BY id LIMIT ?`,
        [limit],
      )
      .map(({ manager, ...r }) => ({ ...r, user_id: m2o(1, manager) }));
  }

  getKpis(): OdooKpis {
    const count = (sql: string) => Number(this.db.get<{ n: number }>(sql)?.n ?? 0);
    return {
      sales: count("SELECT count(*) AS n FROM odoo_sale_order WHERE state IN ('sale', 'done')"),
      customers: count("SELECT count(*) AS n FROM odoo_partner WHERE customer_rank > 0"),
      products: count("SELECT count(*) AS n FROM odoo_product WHERE sale_ok = 1"),
      open_opportunities: count("SELECT count(*) AS n FROM odoo_lead WHERE type = 'opportunity' AND probability < 100"),
      unpaid_invoices: count(
        `SELECT count(*) AS n FROM odoo_invoice
          WHERE move_type = 'out_invoice' AND payment_state IN ('not_paid', 'partial') AND state = 'posted'`,
      ),
      employees: count("SELECT count(*) AS n FROM odoo_employee WHERE active = 1"),
    };
  }

  /** Dades en brut d'un domini, com `GET /odoo/data/:domain`. */
  rawData(domain: OdooDomain, limit?: number): OdooRecord[] | OdooKpis {
    switch (domain) {
      case "sales":
        return this.getSales(limit);
      case "customers":
        return this.getCustomers(limit);
      case "products":
        return this.getProducts(limit);
      case "crm":
        return this.getCrmLeads(limit);
      case "stock":
        return this.getStock(limit);
      case "invoices":
        return this.getInvoices(limit);
      case "purchases":
        return this.getPurchases(limit);
      case "employees":
        return this.getEmployees(limit);
      case "projects":
        return this.getProjects(limit);
      case "kpis":
        return this.getKpis();
    }
  }

  // ── Agregats que el xat fa servir per respondre ───────────────────────────

  /** Facturació de comandes confirmades per mes (`YYYY-MM`), de més antic a més recent. */
  salesByMonth(): { month: string; total: number; orders: number }[] {
    return this.db.all(
      `SELECT substr(date_order, 1, 7) AS month, round(sum(amount_total), 2) AS total, count(*) AS orders
         FROM odoo_sale_order WHERE state IN ('sale', 'done')
        GROUP BY month ORDER BY month`,
    );
  }

  salesByCustomer(limit = 6): { name: string; total: number; orders: number }[] {
    return this.db.all(
      `SELECT p.name, round(sum(o.amount_total), 2) AS total, count(*) AS orders
         FROM odoo_sale_order o JOIN odoo_partner p ON p.id = o.partner_id
        WHERE o.state IN ('sale', 'done')
        GROUP BY p.id ORDER BY total DESC LIMIT ?`,
      [limit],
    );
  }

  /** Productes per unitats venudes en comandes confirmades. */
  topProducts(limit = 6): { id: number; name: string; qty: number; revenue: number; list_price: number }[] {
    return this.db.all(
      `SELECT pr.id, pr.name, sum(l.product_uom_qty) AS qty, round(sum(l.product_uom_qty * l.price_unit), 2) AS revenue, pr.list_price
         FROM odoo_sale_order_line l
         JOIN odoo_sale_order o ON o.id = l.order_id
         JOIN odoo_product pr ON pr.id = l.product_id
        WHERE o.state IN ('sale', 'done')
        GROUP BY pr.id ORDER BY qty DESC LIMIT ?`,
      [limit],
    );
  }

  invoicesByPaymentState(): { payment_state: string; total: number; count: number }[] {
    return this.db.all(
      `SELECT payment_state, round(sum(amount_total), 2) AS total, count(*) AS count
         FROM odoo_invoice WHERE move_type = 'out_invoice' AND state = 'posted'
        GROUP BY payment_state ORDER BY total DESC`,
    );
  }

  unpaidInvoices(limit = 8): { name: string; partner: string; amount_total: number; invoice_date: string; payment_state: string }[] {
    return this.db.all(
      `SELECT i.name, p.name AS partner, i.amount_total, i.invoice_date, i.payment_state
         FROM odoo_invoice i JOIN odoo_partner p ON p.id = i.partner_id
        WHERE i.move_type = 'out_invoice' AND i.state = 'posted' AND i.payment_state IN ('not_paid', 'partial')
        ORDER BY i.amount_total DESC LIMIT ?`,
      [limit],
    );
  }

  pipelineByStage(): { stage: string; total: number; count: number }[] {
    return this.db.all(
      `SELECT stage, round(sum(expected_revenue), 2) AS total, count(*) AS count
         FROM odoo_lead WHERE type = 'opportunity' GROUP BY stage ORDER BY total DESC`,
    );
  }

  employeesByDepartment(): { department: string; count: number }[] {
    return this.db.all("SELECT department, count(*) AS count FROM odoo_employee WHERE active = 1 GROUP BY department ORDER BY count DESC");
  }

  purchasesBySupplier(): { name: string; total: number; orders: number }[] {
    return this.db.all(
      `SELECT p.name, round(sum(o.amount_total), 2) AS total, count(*) AS orders
         FROM odoo_purchase_order o JOIN odoo_partner p ON p.id = o.partner_id
        WHERE o.state IN ('purchase', 'done') GROUP BY p.id ORDER BY total DESC`,
    );
  }

  /** Tots els clients i productes, per reconèixer-ne els noms dins d'una frase. */
  customerNames(): { id: number; name: string }[] {
    return this.db.all("SELECT id, name FROM odoo_partner WHERE customer_rank > 0");
  }

  productNames(): { id: number; name: string; list_price: number }[] {
    return this.db.all("SELECT id, name, list_price FROM odoo_product WHERE sale_ok = 1");
  }

  /**
   * Crea i publica una factura de client, com fa `OdooClientService.createInvoice`.
   * Si el client no existeix, el crea. Retorna el número i el total amb IVA (21 %).
   */
  createInvoice(partnerName: string, lines: InvoiceLine[], today: Date): { id: number; name: string; total: number } {
    return this.db.transaction(() => {
      const existing = this.db.get<{ id: number }>("SELECT id FROM odoo_partner WHERE lower(name) = lower(?)", [partnerName]);
      const partnerId =
        existing?.id ??
        this.db.insert("INSERT INTO odoo_partner (name, email, country, customer_rank, supplier_rank) VALUES (?, NULL, 'Espanya', 1, 0)", [
          partnerName,
        ]);
      // El número següent al més alt que hi hagi (`FAC/AAAA/NNNNN`).
      const last = this.db.get<{ n: number }>("SELECT max(CAST(substr(name, -5) AS INTEGER)) AS n FROM odoo_invoice");
      const sequence = Number(last?.n ?? 0) + 1;
      const name = `FAC/${today.getFullYear()}/${String(sequence).padStart(5, "0")}`;
      const total = round2(lines.reduce((sum, l) => sum + l.quantity * l.price, 0) * 1.21);
      const id = this.db.insert(
        "INSERT INTO odoo_invoice (name, partner_id, amount_total, invoice_date, payment_state, state, move_type) VALUES (?, ?, ?, ?, 'not_paid', 'posted', 'out_invoice')",
        [name, partnerId, total, today.toISOString().slice(0, 10)],
      );
      for (const line of lines) {
        this.db.run("INSERT INTO odoo_invoice_line (invoice_id, name, quantity, price_unit) VALUES (?, ?, ?, ?)", [
          id,
          line.description,
          line.quantity,
          line.price,
        ]);
      }
      return { id, name, total };
    });
  }
}
