import {
  fieldValue,
  matchesDomain,
  OdooRecord,
  pickFields,
  readGroup,
  sortRecords,
} from './simulated-odoo.domain';

const orders: OdooRecord[] = [
  {
    id: 1,
    name: 'S00001',
    state: 'sale',
    amount_total: 100,
    partner_id: [7, 'Acme'],
  },
  {
    id: 2,
    name: 'S00002',
    state: 'draft',
    amount_total: 250,
    partner_id: [8, 'Beta'],
  },
  {
    id: 3,
    name: 'S00003',
    state: 'done',
    amount_total: 40,
    partner_id: [7, 'Acme'],
  },
];
const related = (model: string, id: number) =>
  model === 'sale.order' ? orders.find((o) => o.id === id) : undefined;
const match = (record: OdooRecord, domain: unknown[], model = 'sale.order') =>
  matchesDomain(model, record, domain, related);

describe('simulated Odoo domains', () => {
  it('applies every leaf (implicit AND)', () => {
    const domain = [
      ['state', 'in', ['sale', 'done']],
      ['amount_total', '>', 50],
    ];
    expect(orders.filter((o) => match(o, domain)).map((o) => o.id)).toEqual([
      1,
    ]);
  });

  it('compares a many2one by id and searches it by name', () => {
    expect(match(orders[0], [['partner_id', '=', 7]])).toBe(true);
    expect(match(orders[1], [['partner_id', '=', 7]])).toBe(false);
    expect(match(orders[1], [['partner_id', 'ilike', 'bet']])).toBe(true);
  });

  it('treats false as "no value"', () => {
    const lead: OdooRecord = { id: 1, partner_id: false, active: true };
    expect(match(lead, [['partner_id', '=', false]])).toBe(true);
    expect(match(lead, [['active', '=', true]])).toBe(true);
    expect(match(lead, [['active', '!=', false]])).toBe(true);
  });

  it('follows a many2one on dotted paths', () => {
    const line: OdooRecord = {
      id: 1,
      order_id: [3, 'S00003'],
      product_uom_qty: 2,
    };
    expect(fieldValue('sale.order.line', line, 'order_id.state', related)).toBe(
      'done',
    );
    expect(
      match(
        line,
        [['order_id.state', 'in', ['sale', 'done']]],
        'sale.order.line',
      ),
    ).toBe(true);
    const draftLine: OdooRecord = { id: 2, order_id: [2, 'S00002'] };
    expect(
      match(
        draftLine,
        [['order_id.state', 'in', ['sale', 'done']]],
        'sale.order.line',
      ),
    ).toBe(false);
  });

  it('rejects operators and terms it does not implement', () => {
    expect(() => match(orders[0], [['name', '=like', 'S%']])).toThrow(
      /unsupported/,
    );
    expect(() =>
      match(orders[0], ['|', ['id', '=', 1], ['id', '=', 2]]),
    ).toThrow(/unsupported/);
  });
});

describe('simulated Odoo ordering and projection', () => {
  it('sorts by an Odoo order string', () => {
    expect(sortRecords(orders, 'amount_total desc').map((o) => o.id)).toEqual([
      2, 1, 3,
    ]);
    expect(
      sortRecords(orders, 'partner_id asc, amount_total asc').map((o) => o.id),
    ).toEqual([3, 1, 2]);
    expect(sortRecords(orders, '')).toBe(orders);
  });

  it('keeps id plus the requested fields, with false for the missing ones', () => {
    expect(pickFields(orders[0], ['name', 'email'])).toEqual({
      id: 1,
      name: 'S00001',
      email: false,
    });
  });
});

describe('simulated Odoo read_group', () => {
  const lines: OdooRecord[] = [
    { id: 1, product_id: [1, 'Tauler'], product_uom_qty: 4 },
    { id: 2, product_id: [2, 'Frontissa'], product_uom_qty: 30 },
    { id: 3, product_id: [1, 'Tauler'], product_uom_qty: 6 },
  ];

  it('sums the numeric fields per group and counts the records', () => {
    expect(readGroup(lines, ['product_uom_qty'], 'product_id')).toEqual([
      { product_id: [1, 'Tauler'], product_id_count: 2, product_uom_qty: 10 },
      {
        product_id: [2, 'Frontissa'],
        product_id_count: 1,
        product_uom_qty: 30,
      },
    ]);
  });

  it('orders and limits the groups', () => {
    const top = readGroup(lines, ['product_uom_qty'], 'product_id', {
      orderby: 'product_uom_qty desc',
      limit: 1,
    });
    expect(top).toHaveLength(1);
    expect(top[0].product_id).toEqual([2, 'Frontissa']);
  });
});
