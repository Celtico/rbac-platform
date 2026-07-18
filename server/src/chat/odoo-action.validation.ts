import { z } from 'zod';

/**
 * Validation for Odoo write-action parameters extracted by the LLM.
 *
 * The LLM output is UNTRUSTED (prompt-injectable), so it must never reach an
 * Odoo write without passing this schema: types are enforced, numbers must be
 * finite and within sane bounds, and the line list is capped. This prevents a
 * crafted/garbage response from posting invoices with negative/absurd values
 * or crashing on a non-array `lines`.
 */
const MAX_QTY = 100_000;
const MAX_PRICE = 10_000_000;
const MAX_LINES = 50;

export const InvoiceLineSchema = z.object({
  description: z.string().trim().min(1).max(200).nullish(),
  quantity: z.number().finite().gt(0).max(MAX_QTY).nullish(),
  price: z.number().finite().gt(0).max(MAX_PRICE).nullish(),
});

export const InvoiceParamsSchema = z.object({
  partner_name: z.string().trim().min(1).max(200).nullish(),
  lines: z.array(InvoiceLineSchema).max(MAX_LINES).default([]),
  use_most_sold: z.boolean().default(false),
});

export type InvoiceParams = z.infer<typeof InvoiceParamsSchema>;

/**
 * Whether a user message is an explicit confirmation to proceed with a write
 * action. Used to require a deliberate "yes" before creating Odoo records,
 * instead of trusting a single LLM classification.
 */
export function isConfirmation(text: string | undefined | null): boolean {
  const t = (text ?? '').toLowerCase().replace(/[`´’]/g, "'");
  // Unambiguous confirmation words.
  if (/\b(confirm\w*|endavant|procedeix|d'?acord|vale)\b/.test(t)) return true;
  // "crea-la" / "crea la" / "fes-la".
  if (/\b(crea|fes)[\s-]la\b/.test(t)) return true;
  // An affirmative ("sí"/"ok") together with a create verb, e.g. "sí, crea".
  // Uses Unicode letter boundaries so the accented "í" matches correctly, and
  // requires the create verb so the initial request ("crea una factura…")
  // does NOT count as a confirmation.
  const affirmative = /(^|[^\p{L}])(s[ií]|ok)([^\p{L}]|$)/u.test(t);
  const createVerb = /\b(crea|fes|endavant)\b/.test(t);
  return affirmative && createVerb;
}

/**
 * Whether `text` explicitly cancels/aborts a pending action. Used to let the
 * user back out of a pending invoice confirmation deterministically.
 */
export function isCancellation(text: string | undefined | null): boolean {
  const t = (text ?? '').toLowerCase().replace(/[`´’]/g, "'");
  return /\b(cancel\w*|anul\w*|atura|para|deixa[\s-]?ho|no ho facis|millor no|descarta)\b/.test(
    t,
  );
}
