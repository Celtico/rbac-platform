/**
 * Pure helpers behind the simulated Odoo: the subset of Odoo's ORM semantics
 * the backend relies on (search domains, ordering, field projection and
 * `read_group`). No database and no Nest here, so it is all unit-tested.
 */

export type OdooRecord = Record<string, unknown> & { id: number };
export type DomainLeaf = [string, string, unknown];

/** `model → field → related model`, for dotted paths such as `order_id.state`. */
export const RELATIONS: Record<string, Record<string, string>> = {
  'sale.order': { partner_id: 'res.partner' },
  'sale.order.line': { order_id: 'sale.order', product_id: 'product.product' },
  'account.move': { partner_id: 'res.partner' },
  'purchase.order': { partner_id: 'res.partner' },
  'crm.lead': { partner_id: 'res.partner' },
};

/** Looks a related record up by model and id. */
export type RelatedLookup = (
  model: string,
  id: number,
) => OdooRecord | undefined;

/** The id of a many2one value (`[id, name]`), or the value itself. */
function scalar(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

/** Resolves `field` on a record, following many2one fields on dotted paths. */
export function fieldValue(
  model: string,
  record: OdooRecord,
  field: string,
  related: RelatedLookup,
): unknown {
  const [head, ...rest] = field.split('.');
  const value = record[head];
  if (rest.length === 0) return value;

  const target = RELATIONS[model]?.[head];
  const id = scalar(value);
  if (!target || typeof id !== 'number') return undefined;
  const next = related(target, id);
  return next ? fieldValue(target, next, rest.join('.'), related) : undefined;
}

/** Text form of a scalar field value; empty for "no value" and objects. */
function text(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
}

function compare(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return text(a).localeCompare(text(b));
}

function matchesLeaf(
  actual: unknown,
  operator: string,
  expected: unknown,
): boolean {
  const value = scalar(actual);
  switch (operator) {
    case '=':
      // Odoo stores "no value" as false: `['x', '=', false]` matches empty fields.
      return expected === false ? !value : value === expected;
    case '!=':
      return expected === false ? !!value : value !== expected;
    case 'in':
      return Array.isArray(expected) && expected.includes(value);
    case 'not in':
      return Array.isArray(expected) && !expected.includes(value);
    case '>':
      return compare(value, expected) > 0;
    case '>=':
      return compare(value, expected) >= 0;
    case '<':
      return compare(value, expected) < 0;
    case '<=':
      return compare(value, expected) <= 0;
    case 'like':
    case 'ilike': {
      // A many2one is searched by its display name, like Odoo does.
      const shown: unknown = Array.isArray(actual) ? actual[1] : actual;
      return text(shown).toLowerCase().includes(text(expected).toLowerCase());
    }
    default:
      throw new Error(
        `Simulated Odoo: unsupported domain operator "${operator}"`,
      );
  }
}

/** `true` if the record satisfies every leaf (Odoo's implicit AND). */
export function matchesDomain(
  model: string,
  record: OdooRecord,
  domain: unknown[],
  related: RelatedLookup,
): boolean {
  return domain.every((leaf) => {
    if (!Array.isArray(leaf) || leaf.length !== 3) {
      // '|', '&' and '!' are never sent by this backend.
      throw new Error(
        `Simulated Odoo: unsupported domain term ${JSON.stringify(leaf)}`,
      );
    }
    const [field, operator, expected] = leaf as DomainLeaf;
    return matchesLeaf(
      fieldValue(model, record, field, related),
      operator,
      expected,
    );
  });
}

/** Sorts by an Odoo `order` string such as `"date_order desc, id"`. */
export function sortRecords<T extends Record<string, unknown>>(
  records: T[],
  order: string,
): T[] {
  const keys = order
    .split(',')
    .map((part) => part.trim().split(/\s+/))
    .filter(([field]) => field)
    .map(([field, direction]) => ({
      field,
      sign: direction?.toLowerCase() === 'desc' ? -1 : 1,
    }));
  if (keys.length === 0) return records;
  return [...records].sort((a, b) => {
    for (const { field, sign } of keys) {
      const diff = compare(scalar(a[field]), scalar(b[field]));
      if (diff !== 0) return diff * sign;
    }
    return 0;
  });
}

/** Keeps `id` plus the requested fields; a missing field reads as `false`. */
export function pickFields(record: OdooRecord, fields: string[]): OdooRecord {
  if (fields.length === 0) return { ...record };
  const out: OdooRecord = { id: record.id };
  for (const field of fields) out[field] = record[field] ?? false;
  return out;
}

/**
 * Odoo's `read_group` for a single group-by field: one row per distinct value,
 * with the numeric `fields` summed and a `<groupby>_count`.
 */
export function readGroup(
  records: OdooRecord[],
  fields: string[],
  groupby: string,
  options: { orderby?: string; limit?: number } = {},
): Record<string, unknown>[] {
  const groups = new Map<unknown, Record<string, unknown>>();
  for (const record of records) {
    const key = scalar(record[groupby]);
    let group = groups.get(key);
    if (!group) {
      group = { [groupby]: record[groupby] ?? false, [`${groupby}_count`]: 0 };
      for (const field of fields) group[field] = 0;
      groups.set(key, group);
    }
    group[`${groupby}_count`] = (group[`${groupby}_count`] as number) + 1;
    for (const field of fields) {
      const value = record[field];
      if (typeof value === 'number')
        group[field] = (group[field] as number) + value;
    }
  }
  const sorted = sortRecords([...groups.values()], options.orderby ?? '');
  return options.limit ? sorted.slice(0, options.limit) : sorted;
}
