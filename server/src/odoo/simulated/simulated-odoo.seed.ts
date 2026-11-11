import type { OdooRecord } from './simulated-odoo.domain';

/**
 * Demo dataset of the simulated Odoo: a made-up joinery with six months of
 * activity. Nothing here comes from a real installation.
 *
 * It is generated from a fixed-seed pseudo-random generator, so every fresh
 * database starts with the same companies, products and amounts; only the
 * dates move, because they are relative to the day it is seeded.
 */

type M2O = [number, string];

const CUSTOMERS: [string, string][] = [
  ['Mobles Segrià SL', 'Espanya'],
  ['Construccions Ponent SA', 'Espanya'],
  ["Hotel Vall d'Aran", 'Espanya'],
  ['Interiorisme Garriga', 'Espanya'],
  ['Restaurant El Celler', 'Espanya'],
  ['Arquitectes Urgell', 'Espanya'],
  ['Cuines Pirineu SL', 'Espanya'],
  ['Ajuntament de Vilanova', 'Espanya'],
  ['Estudi Noguera', 'Espanya'],
  ['Menuiserie Roussillon', 'França'],
  ['Casa Rural Montsec', 'Espanya'],
  ["Oficines Pla d'Urgell", 'Espanya'],
  ['Botiga La Fusta', 'Espanya'],
  ['Promocions Cinca SL', 'Espanya'],
];

const SUPPLIERS = [
  'Fustes Solsonès SA',
  'Taulers Ebre SL',
  'Ferramenta Lleidatana',
  'Vernissos Catalunya',
  'Maquinària CNC Ibèrica',
];

// [name, category, list price, stock, type]
const PRODUCTS: [string, string, number, number, 'product' | 'service'][] = [
  ['Tauler de roure 19 mm', 'Taulers', 86.5, 42, 'product'],
  ['Tauler de faig 19 mm', 'Taulers', 72.0, 35, 'product'],
  ['Tauler melamina blanca 16 mm', 'Taulers', 24.9, 120, 'product'],
  ['Tauler hidròfug 19 mm', 'Taulers', 41.3, 8, 'product'],
  ['Sobre de noguera massís', 'Massissos', 640.0, 6, 'product'],
  ['Llistó de pi 45 × 45', 'Massissos', 7.8, 260, 'product'],
  ['Moble de cos baix 60', 'Mobles', 185.0, 14, 'product'],
  ['Moble de cos alt 80', 'Mobles', 210.0, 9, 'product'],
  ['Prestatgeria modular', 'Mobles', 320.0, 11, 'product'],
  ['Armari de dues portes', 'Mobles', 540.0, 4, 'product'],
  ['Frontissa de cassoleta', 'Ferramenta', 3.2, 900, 'product'],
  ['Guia de calaix 500 mm', 'Ferramenta', 14.6, 3, 'product'],
  ["Vernís a l'aigua 5 L", 'Acabats', 58.0, 22, 'product'],
  ['Tall a mida CNC', 'Serveis', 45.0, 0, 'service'],
  ['Muntatge a domicili', 'Serveis', 60.0, 0, 'service'],
  ['Disseny i plànols', 'Serveis', 380.0, 0, 'service'],
];

const EMPLOYEES: [string, string, string][] = [
  ['Marta Solé', 'Directora general', 'Direcció'],
  ['Jordi Pujol Vidal', 'Cap de taller', 'Producció'],
  ['Laia Ferrer', 'Fustera', 'Producció'],
  ['Pau Riba', 'Operari CNC', 'Producció'],
  ['Núria Bosch', 'Operària CNC', 'Producció'],
  ['Oriol Camps', 'Muntador', 'Producció'],
  ['Anna Roca', 'Dissenyadora', 'Oficina tècnica'],
  ['Marc Sala', 'Delineant', 'Oficina tècnica'],
  ['Carla Mir', 'Comercial', 'Vendes'],
  ['Arnau Font', 'Comercial', 'Vendes'],
  ['Júlia Vila', 'Administrativa', 'Administració'],
  ['Pere Coll', 'Comptable', 'Administració'],
  ['Sílvia Puig', 'Compres', 'Administració'],
  ['Roger Mas', 'Aprenent', 'Producció'],
];

const PROJECTS: [string, string, number][] = [
  ["Cuines Hotel Vall d'Aran", 'Jordi Pujol Vidal', 24],
  ['Biblioteca municipal de Vilanova', 'Anna Roca', 31],
  ['Reforma Restaurant El Celler', 'Jordi Pujol Vidal', 12],
  ["Oficines Pla d'Urgell", 'Marc Sala', 18],
  ['Catàleg 2027', 'Carla Mir', 9],
  ['Posada en marxa CNC nova', 'Pau Riba', 7],
];

// [name, expected revenue, probability, stage]
const LEADS: [string, number, number, string][] = [
  ['Mobiliari per a 40 habitacions', 68000, 60, 'Proposta'],
  ['Cuina professional', 21500, 80, 'Negociació'],
  ['Prestatgeries per a arxiu', 12800, 30, 'Qualificat'],
  ["Reforma integral d'oficines", 46000, 50, 'Proposta'],
  ['Taules per a sala de reunions', 8400, 90, 'Negociació'],
  ['Armaris encastats promoció Cinca', 54000, 20, 'Nou'],
  ['Barra i rebost de restaurant', 17300, 70, 'Proposta'],
  ['Mobles de bany a mida', 6900, 40, 'Qualificat'],
  ['Escala i barana de faig', 11200, 100, 'Guanyat'],
  ['Botiga pop-up', 4300, 10, 'Nou'],
  ['Parament de fusta per a vestíbul', 15600, 55, 'Proposta'],
  ["Dotació d'aules", 29800, 35, 'Qualificat'],
];

const STAGES = ['Nou', 'Qualificat', 'Proposta', 'Negociació', 'Guanyat'];
const DEPARTMENTS = [
  'Direcció',
  'Producció',
  'Oficina tècnica',
  'Vendes',
  'Administració',
];
const CATEGORIES = [
  'Taulers',
  'Massissos',
  'Mobles',
  'Ferramenta',
  'Acabats',
  'Serveis',
];

/** VAT applied to the demo's sales and invoices. */
export const SIMULATED_VAT = 0.21;

/** Deterministic pseudo-random generator (mulberry32). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const slug = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Odoo datetime (`YYYY-MM-DD HH:MM:SS`, UTC). */
export const odooDateTime = (d: Date) =>
  d.toISOString().slice(0, 19).replace('T', ' ');
/** Odoo date (`YYYY-MM-DD`). */
export const odooDate = (d: Date) => d.toISOString().slice(0, 10);

/** Sequence name of a posted customer invoice. */
export const invoiceName = (year: number, sequence: number) =>
  `FAC/${year}/${String(sequence).padStart(5, '0')}`;

/** The whole demo dataset, as `model → records`. */
export function buildSimulatedDataset(now: Date): Record<string, OdooRecord[]> {
  const rand = mulberry32(20260911);
  const daysAgo = (days: number, hour: number) => {
    const d = new Date(now.getTime() - days * 86_400_000);
    d.setUTCHours(hour, Math.floor(rand() * 60), 0, 0);
    return d;
  };
  const m2o = (names: string[], name: string): M2O => [
    names.indexOf(name) + 1,
    name,
  ];

  const partners: OdooRecord[] = [
    ...CUSTOMERS.map(([name, country], i) => ({
      id: i + 1,
      name,
      email: `comandes@${slug(name)}.example`,
      customer_rank: CUSTOMERS.length - i,
      supplier_rank: 0,
      country_id: [country === 'França' ? 75 : 68, country] as M2O,
    })),
    ...SUPPLIERS.map((name, i) => ({
      id: CUSTOMERS.length + i + 1,
      name,
      email: `vendes@${slug(name)}.example`,
      customer_rank: 0,
      supplier_rank: SUPPLIERS.length - i,
      country_id: [68, 'Espanya'] as M2O,
    })),
  ];
  const partnerRef = (id: number): M2O => [id, String(partners[id - 1].name)];

  const products: OdooRecord[] = PRODUCTS.map(
    ([name, category, price, qty, type], i) => ({
      id: i + 1,
      name,
      list_price: price,
      categ_id: m2o(CATEGORIES, category),
      qty_available: qty,
      virtual_available:
        type === 'service' ? 0 : Math.max(0, qty - Math.floor(rand() * 6)),
      uom_id: (type === 'service' ? [2, 'Hores'] : [1, 'Unitats']) as M2O,
      type,
      sale_ok: true,
    }),
  );

  // ~44 confirmed sale orders; the first customers buy more often.
  const saleOrders: OdooRecord[] = [];
  const saleLines: OdooRecord[] = [];
  for (let n = 0; n < 44; n++) {
    const customerId = Math.floor(rand() * rand() * CUSTOMERS.length) + 1;
    const date = daysAgo(Math.floor(rand() * 180), 8 + Math.floor(rand() * 9));
    const orderId = n + 1;
    const name = `S${String(orderId).padStart(5, '0')}`;
    let untaxed = 0;
    const lineCount = 1 + Math.floor(rand() * 3);
    for (let l = 0; l < lineCount; l++) {
      const index = Math.floor(rand() * PRODUCTS.length);
      const [productName, , price, , type] = PRODUCTS[index];
      const qty =
        type === 'service'
          ? 1 + Math.floor(rand() * 8)
          : 1 + Math.floor(rand() * 12);
      untaxed += qty * price;
      saleLines.push({
        id: saleLines.length + 1,
        order_id: [orderId, name] as M2O,
        product_id: [index + 1, productName] as M2O,
        product_uom_qty: qty,
        price_unit: price,
      });
    }
    saleOrders.push({
      id: orderId,
      name,
      partner_id: partnerRef(customerId),
      amount_total: round2(untaxed * (1 + SIMULATED_VAT)),
      date_order: odooDateTime(date),
      state: rand() < 0.75 ? 'sale' : 'done',
    });
  }

  // Customer invoices: one for most orders; the recent ones are still unpaid.
  const invoices: OdooRecord[] = [];
  [...saleOrders]
    .sort((a, b) => String(a.date_order).localeCompare(String(b.date_order)))
    .forEach((order) => {
      if (rand() < 0.2) return;
      const orderDate = new Date(
        String(order.date_order).replace(' ', 'T') + 'Z',
      );
      const ageDays = (now.getTime() - orderDate.getTime()) / 86_400_000;
      const roll = rand();
      const paymentState =
        ageDays > 45
          ? roll < 0.9
            ? 'paid'
            : 'not_paid'
          : roll < 0.45
            ? 'paid'
            : roll < 0.8
              ? 'not_paid'
              : 'partial';
      const id = invoices.length + 1;
      invoices.push({
        id,
        name: invoiceName(orderDate.getUTCFullYear(), id),
        partner_id: order.partner_id,
        amount_total: order.amount_total,
        invoice_date: odooDate(orderDate),
        payment_state: paymentState,
        state: 'posted',
        move_type: 'out_invoice',
      });
    });

  const purchases: OdooRecord[] = Array.from({ length: 14 }, (_, n) => ({
    id: n + 1,
    name: `P${String(n + 1).padStart(5, '0')}`,
    partner_id: partnerRef(
      CUSTOMERS.length + 1 + Math.floor(rand() * SUPPLIERS.length),
    ),
    amount_total: round2(400 + rand() * 5200),
    date_order: odooDateTime(daysAgo(Math.floor(rand() * 150), 11)),
    state: rand() < 0.7 ? 'purchase' : 'done',
  }));

  const salespeople = ['Carla Mir', 'Arnau Font'];
  const leads: OdooRecord[] = LEADS.map(
    ([name, revenue, probability, stage], i) => ({
      id: i + 1,
      name,
      partner_id: partnerRef((i % CUSTOMERS.length) + 1),
      expected_revenue: revenue,
      probability,
      stage_id: m2o(STAGES, stage),
      user_id: [i % 2 === 0 ? 9 : 10, salespeople[i % 2]] as M2O,
      type: 'opportunity',
    }),
  );

  const employees: OdooRecord[] = EMPLOYEES.map(
    ([name, job, department], i) => {
      const [first, last = ''] = name.split(' ');
      return {
        id: i + 1,
        name,
        job_title: job,
        department_id: m2o(DEPARTMENTS, department),
        work_email: `${slug(first)}.${slug(last)}@fusteria.example`,
        active: true,
      };
    },
  );

  const projects: OdooRecord[] = PROJECTS.map(([name, manager, tasks], i) => ({
    id: i + 1,
    name,
    user_id: [EMPLOYEES.findIndex(([n]) => n === manager) + 1, manager] as M2O,
    task_count: tasks,
    date_start: odooDate(daysAgo(120 - i * 15, 9)),
    date: odooDate(new Date(now.getTime() + (20 + i * 25) * 86_400_000)),
    active: true,
  }));

  return {
    'res.partner': partners,
    'product.product': products,
    'sale.order': saleOrders,
    'sale.order.line': saleLines,
    'account.move': invoices,
    'purchase.order': purchases,
    'crm.lead': leads,
    'hr.employee': employees,
    'project.project': projects,
  };
}
