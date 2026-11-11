import type { DemoDb } from "./db";
import { SimulatedOdoo, type InvoiceLine } from "./odoo";
import { addLog, can, type DemoUser } from "./server";

/**
 * Xat simulat. Aquí **no hi ha cap model d'IA**: la pregunta es classifica amb
 * paraules clau i es respon amb consultes a l'Odoo simulat. Segueix el mateix
 * guió que l'orquestrador del backend (`chat-orchestrator.service.ts`):
 * lectures d'Odoo, i factures que no es creen fins que l'usuari les confirma.
 */

export interface ChatAnswer {
  answer: string;
  intent: string;
  confidence: number;
}

interface PendingInvoice {
  partnerName: string;
  lines: InvoiceLine[];
  total: number;
  expiresAt: number;
}

const VAT = 0.21;
const PENDING_TTL_MS = 10 * 60_000;

/** Factures pendents de confirmar, per conversa. Viuen només en memòria. */
const pendingInvoices = new Map<number, PendingInvoice>();

// ── Text ────────────────────────────────────────────────────────────────────

/** Minúscules, sense accents ni apòstrofs, i amb els espais normalitzats. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’·]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const eur = (n: number) => `${n.toLocaleString("ca-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const num = (n: number) => n.toLocaleString("ca-ES", { maximumFractionDigits: 2 });

function table(headers: string[], rows: (string | number)[][]): string {
  const line = (cells: (string | number)[]) => `| ${cells.join(" | ")} |`;
  return [line(headers), line(headers.map(() => "---")), ...rows.map(line)].join("\n");
}

const MONTHS = ["gener", "febrer", "març", "abril", "maig", "juny", "juliol", "agost", "setembre", "octubre", "novembre", "desembre"];
const monthName = (yyyyMm: string) => `${MONTHS[Number(yyyyMm.slice(5, 7)) - 1]} ${yyyyMm.slice(0, 4)}`;

const PAYMENT_STATES: Record<string, string> = { paid: "Pagada", not_paid: "Pendent", partial: "Pagament parcial" };

// ── Respostes de lectura ────────────────────────────────────────────────────

function sales(odoo: SimulatedOdoo): string {
  const months = odoo.salesByMonth().slice(-6);
  const customers = odoo.salesByCustomer(5);
  const total = months.reduce((sum, m) => sum + m.total, 0);
  const last = months[months.length - 1];
  const previous = months[months.length - 2];
  const trend =
    last && previous && previous.total > 0
      ? ` El darrer mes (${monthName(last.month)}) ${last.total >= previous.total ? "puja" : "baixa"} un ${num(Math.abs((last.total / previous.total - 1) * 100))} % respecte de l'anterior.`
      : "";
  return [
    `En els darrers ${months.length} mesos s'han facturat **${eur(total)}** en comandes confirmades.${trend}`,
    table(["Mes", "Comandes", "Import"], months.map((m) => [monthName(m.month), m.orders, eur(m.total)])),
    "**Clients que més compren**",
    table(["Client", "Comandes", "Import"], customers.map((c) => [c.name, c.orders, eur(c.total)])),
  ].join("\n\n");
}

function unpaidInvoices(odoo: SimulatedOdoo): string {
  const invoices = odoo.unpaidInvoices(10);
  if (invoices.length === 0) return "No hi ha cap factura pendent de cobrament.";
  const states = odoo.invoicesByPaymentState();
  const pending = states.filter((s) => s.payment_state !== "paid");
  const total = pending.reduce((sum, s) => sum + s.total, 0);
  const count = pending.reduce((sum, s) => sum + s.count, 0);
  return [
    `Hi ha **${count} factures pendents** de cobrament, per un total de **${eur(total)}**. Aquestes són les de més import:`,
    table(
      ["Factura", "Client", "Data", "Estat", "Import"],
      invoices.map((i) => [i.name, i.partner, i.invoice_date, PAYMENT_STATES[i.payment_state] ?? i.payment_state, eur(i.amount_total)]),
    ),
  ].join("\n\n");
}

function invoices(odoo: SimulatedOdoo): string {
  const states = odoo.invoicesByPaymentState();
  const recent = odoo.getInvoices(6);
  return [
    "**Factures emeses, per estat de cobrament**",
    table(["Estat", "Factures", "Import"], states.map((s) => [PAYMENT_STATES[s.payment_state] ?? s.payment_state, s.count, eur(s.total)])),
    "**Les més recents**",
    table(
      ["Factura", "Client", "Data", "Import"],
      recent.map((i) => [String(i.name), (i.partner_id as [number, string])[1], String(i.invoice_date), eur(Number(i.amount_total))]),
    ),
  ].join("\n\n");
}

function topProducts(odoo: SimulatedOdoo): string {
  const products = odoo.topProducts(6);
  if (products.length === 0) return "Encara no hi ha vendes per calcular-ho.";
  const best = products[0];
  return [
    `El producte més venut és **${best.name}**, amb ${num(best.qty)} unitats i ${eur(best.revenue)} facturats.`,
    table(["Producte", "Unitats", "Import"], products.map((p) => [p.name, num(p.qty), eur(p.revenue)])),
  ].join("\n\n");
}

function stock(odoo: SimulatedOdoo): string {
  const items = odoo.getStock(8);
  const low = items.filter((i) => Number(i.qty_available) < 10);
  const intro = low.length
    ? `Hi ha **${low.length} productes amb menys de 10 unitats**. Els de menys estoc:`
    : "No hi ha cap producte amb l'estoc baix. Els de menys estoc:";
  return [intro, table(["Producte", "Disponible", "Previst"], items.map((i) => [String(i.name), num(Number(i.qty_available)), num(Number(i.virtual_available))]))].join(
    "\n\n",
  );
}

function products(odoo: SimulatedOdoo): string {
  const items = odoo.getProducts(20);
  return [
    `El catàleg té **${items.length} productes** a la venda:`,
    table(["Producte", "Categoria", "Preu"], items.map((p) => [String(p.name), (p.categ_id as [number, string])[1], eur(Number(p.list_price))])),
  ].join("\n\n");
}

function customers(odoo: SimulatedOdoo): string {
  const top = odoo.salesByCustomer(8);
  return [
    `Hi ha **${odoo.getKpis().customers} clients**. Els que més han comprat:`,
    table(["Client", "Comandes", "Import"], top.map((c) => [c.name, c.orders, eur(c.total)])),
  ].join("\n\n");
}

function crm(odoo: SimulatedOdoo): string {
  const stages = odoo.pipelineByStage();
  const leads = odoo.getCrmLeads(5);
  const total = stages.reduce((sum, s) => sum + s.total, 0);
  return [
    `El pipeline comercial suma **${eur(total)}** en ${stages.reduce((sum, s) => sum + s.count, 0)} oportunitats.`,
    table(["Etapa", "Oportunitats", "Import previst"], stages.map((s) => [s.stage, s.count, eur(s.total)])),
    "**Les més grans**",
    table(
      ["Oportunitat", "Client", "Probabilitat", "Import"],
      leads.map((l) => [String(l.name), l.partner_id ? (l.partner_id as [number, string])[1] : "—", `${num(Number(l.probability))} %`, eur(Number(l.expected_revenue))]),
    ),
  ].join("\n\n");
}

function purchases(odoo: SimulatedOdoo): string {
  const suppliers = odoo.purchasesBySupplier();
  const total = suppliers.reduce((sum, s) => sum + s.total, 0);
  return [
    `S'han comprat **${eur(total)}** a ${suppliers.length} proveïdors.`,
    table(["Proveïdor", "Comandes", "Import"], suppliers.map((s) => [s.name, s.orders, eur(s.total)])),
  ].join("\n\n");
}

function employees(odoo: SimulatedOdoo): string {
  const departments = odoo.employeesByDepartment();
  const total = departments.reduce((sum, d) => sum + d.count, 0);
  return [`A la plantilla hi ha **${total} persones**:`, table(["Departament", "Persones"], departments.map((d) => [d.department, d.count]))].join("\n\n");
}

function projects(odoo: SimulatedOdoo): string {
  const items = odoo.getProjects(10);
  return [
    `Hi ha **${items.length} projectes actius**:`,
    table(["Projecte", "Responsable", "Tasques"], items.map((p) => [String(p.name), (p.user_id as [number, string])[1], Number(p.task_count)])),
  ].join("\n\n");
}

function kpis(odoo: SimulatedOdoo): string {
  const k = odoo.getKpis();
  return [
    "**Resum del negoci**",
    table(
      ["Indicador", "Valor"],
      [
        ["Comandes de venda confirmades", k.sales],
        ["Clients", k.customers],
        ["Productes a la venda", k.products],
        ["Oportunitats obertes", k.open_opportunities],
        ["Factures pendents de cobrament", k.unpaid_invoices],
        ["Empleats", k.employees],
      ],
    ),
  ].join("\n\n");
}

function platform(db: DemoDb): string {
  const count = (tableName: string) => Number(db.get<{ n: number }>(`SELECT count(*) AS n FROM ${tableName}`)?.n ?? 0);
  const users = db.all<{ username: string; roles: string | null }>(
    `SELECT u.username, group_concat(r.name, ', ') AS roles
       FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id LEFT JOIN roles r ON r.id = ur.role_id
      GROUP BY u.id ORDER BY u.id`,
  );
  return [
    `La plataforma té **${count("users")} usuaris**, ${count("roles")} rols, ${count("permissions")} permisos i ${count("tenants")} tenants.`,
    table(["Usuari", "Rols"], users.map((u) => [u.username, u.roles ?? "—"])),
  ].join("\n\n");
}

function photos(db: DemoDb): string {
  const items = db.all<{ title: string; description: string | null }>("SELECT title, description FROM photos ORDER BY id DESC LIMIT 8");
  return [`A la galeria hi ha **${items.length} àlbums** recents:`, table(["Títol", "Descripció"], items.map((p) => [p.title, p.description ?? "—"]))].join("\n\n");
}

const HELP = [
  "Soc l'assistent de la demo. **No soc un model d'IA**: reconec preguntes per paraules clau i responc amb les dades de l'Odoo simulat que viu al teu navegador.",
  "Em pots demanar, per exemple:",
  [
    "- Com van les vendes?",
    "- Quines factures tenim pendents?",
    "- Quin és el producte més venut?",
    "- Què tenim amb poc estoc?",
    "- Com està el pipeline comercial?",
    "- Crea una factura per a Hotel Vall d'Aran de 3 Prestatgeria modular",
    "- Quants usuaris hi ha?",
  ].join("\n"),
].join("\n\n");

// ── Factures ────────────────────────────────────────────────────────────────

/** Paraules d'un nom que serveixen per reconèixer-lo dins d'una frase. */
function keywords(name: string): string[] {
  return normalize(name)
    .split(" ")
    .filter((w) => w.length > 2 && !["sl", "sa", "de", "del", "per", "amb", "mm"].includes(w));
}

function findCustomer(odoo: SimulatedOdoo, text: string): string | null {
  let best: { name: string; score: number } | null = null;
  for (const customer of odoo.customerNames()) {
    const words = keywords(customer.name);
    const hits = words.filter((w) => new RegExp(`\\b${w}\\b`).test(text)).length;
    // Cal el nom sencer, o almenys dues paraules seves.
    if (hits === words.length || hits >= 2) {
      const score = hits / words.length + hits;
      if (!best || score > best.score) best = { name: customer.name, score };
    }
  }
  return best?.name ?? null;
}

function findLines(odoo: SimulatedOdoo, text: string): InvoiceLine[] {
  const lines: InvoiceLine[] = [];
  for (const product of odoo.productNames()) {
    const words = keywords(product.name).filter((w) => !/^\d+$/.test(w));
    if (words.length === 0 || !words.every((w) => text.includes(w))) continue;
    // La quantitat és el darrer número abans del nom del producte.
    const before = text.slice(0, text.indexOf(words[0]));
    const quantity = /(\d+(?:[.,]\d+)?)\s*(?:x|u|uds?|unitats?|unidades?)?\s*(?:de\s+|d\s+)?$/.exec(before)?.[1];
    lines.push({ description: product.name, quantity: quantity ? Number(quantity.replace(",", ".")) : 1, price: product.list_price });
  }
  if (lines.length > 0) return lines;

  // Sense producte reconegut: "… de 1200 €" es factura com un concepte genèric.
  const amount = /(\d+(?:[.,]\d+)?)\s*(?:€|eur|euros?)/.exec(text)?.[1];
  return amount ? [{ description: "Treballs de fusteria", quantity: 1, price: Number(amount.replace(",", ".")) }] : [];
}

const linesText = (lines: InvoiceLine[]) =>
  lines.map((l) => `- ${num(l.quantity)} × ${l.description} — ${eur(l.price)} = ${eur(l.quantity * l.price)}`).join("\n");

function prepareInvoice(odoo: SimulatedOdoo, conversationId: number, text: string): ChatAnswer {
  const reply = (answer: string): ChatAnswer => ({ answer, intent: "odoo_action", confidence: 0.9 });

  const partnerName = findCustomer(odoo, text);
  if (!partnerName) {
    const names = odoo.customerNames().slice(0, 6).map((c) => `- ${c.name}`).join("\n");
    return reply(`Per a quin client és la factura? No n'he reconegut cap a la frase. Alguns clients:\n\n${names}`);
  }
  const lines = findLines(odoo, text);
  if (lines.length === 0) {
    const names = odoo.productNames().slice(0, 6).map((p) => `- ${p.name} (${eur(p.list_price)})`).join("\n");
    return reply(
      `Què hi poso, a la factura de **${partnerName}**? Digue'm productes i quantitats, o un import. Per exemple: «crea una factura per a ${partnerName} de 2 Moble de cos baix 60».\n\n${names}`,
    );
  }

  const untaxed = lines.reduce((sum, l) => sum + l.quantity * l.price, 0);
  const total = Math.round(untaxed * (1 + VAT) * 100) / 100;
  pendingInvoices.set(conversationId, { partnerName, lines, total, expiresAt: Date.now() + PENDING_TTL_MS });
  return reply(
    `Revisa la factura abans de crear-la:\n\n**Client:** ${partnerName}\n\n${linesText(lines)}\n\nBase: ${eur(untaxed)} · IVA 21 %: ${eur(total - untaxed)}\n\n**Total: ${eur(total)}**\n\n⚠️ Encara NO s'ha creat res a Odoo. Respon **confirma** per crear-la o **cancel·la** per descartar-la.`,
  );
}

function resolvePending(db: DemoDb, odoo: SimulatedOdoo, user: DemoUser, conversationId: number, text: string): ChatAnswer | null {
  const pending = pendingInvoices.get(conversationId);
  if (!pending) return null;
  pendingInvoices.delete(conversationId);
  if (pending.expiresAt < Date.now()) return null;

  if (/^(si|confirma|confirmo|confirmar|d acord|ok|vale|endavant|adelante|yes|confirm)\b/.test(text)) {
    const invoice = odoo.createInvoice(pending.partnerName, pending.lines, new Date());
    addLog(db, "log", "OdooClientService", `Factura ${invoice.name} creada per "${user.username}" (${pending.partnerName}, ${eur(invoice.total)})`);
    return {
      answer: `Factura creada correctament!\n\n**${invoice.name}**\nClient: ${pending.partnerName}\n\n${linesText(pending.lines)}\n\n**Total: ${eur(invoice.total)}**\n\nLa trobaràs al panell i a la secció d'Odoo, com a pendent de cobrament.`,
      intent: "odoo_action",
      confidence: 1,
    };
  }
  if (/^(no|cancel|descarta|anul)/.test(text)) {
    return { answer: "D'acord, he descartat la factura. No s'ha creat res.", intent: "odoo_action", confidence: 1 };
  }
  // Qualsevol altra cosa abandona la factura pendent i es respon normalment.
  return null;
}

// ── Classificació ───────────────────────────────────────────────────────────

const READS: [RegExp, (odoo: SimulatedOdoo) => string][] = [
  [/(factur|invoice).*(pendent|pendient|impag|cobr|deu|venc|unpaid)|(pendent|pendient|impag|unpaid).*(factur|invoice)|que ens deuen|morosos/, unpaidInvoices],
  [/(producte|producto|product|article).*(venut|vendido|sold|top|millor)|(mes venut|mas vendido|best sell|top product)/, topProducts],
  [/estoc|stock|inventari|existenc/, stock],
  [/factur(a|es|as)\b|invoices?\b/, invoices],
  [/vend|venta|sales|facturacio|facturacion|ingress|comand|pedido/, sales],
  [/producte|producto|product|cataleg|catalogo|preus|precios/, products],
  [/client|customer/, customers],
  [/crm|oportunitat|oportunidad|pipeline|lead|comercial/, crm],
  [/compr|proveid|proveed|supplier|purchase/, purchases],
  [/emplea|treballador|trabajador|plantilla|personal|staff|departament/, employees],
  [/project|proyecto/, projects],
  [/kpi|resum|summary|indicador|negoci|negocio|panell|dashboard/, kpis],
];

/** Respon una pregunta del xat. Pot escriure a la base (factures i logs). */
export function answerChat(db: DemoDb, user: DemoUser, conversationId: number, message: string): ChatAnswer {
  const text = normalize(message);
  const odoo = new SimulatedOdoo(db);

  if (can(user, "write:odoo")) {
    const resolved = resolvePending(db, odoo, user, conversationId, text);
    if (resolved) return resolved;
  }

  const wantsInvoice = /factura|invoice/.test(text) && /\b(crea|crear|creem|fes|fer|fem|genera|generar|emet|emetre|nova|nueva|haz|hacer|create|make)\b/.test(text);
  if (wantsInvoice) {
    if (!can(user, "write:odoo")) {
      return {
        answer: "No tens permís per crear factures a Odoo. Cal el permís `write:odoo`; demana'l a un administrador.",
        intent: "odoo_action",
        confidence: 0.9,
      };
    }
    return prepareInvoice(odoo, conversationId, text);
  }

  for (const [pattern, read] of READS) {
    if (!pattern.test(text)) continue;
    if (!can(user, "use:ai")) {
      return {
        answer: "No tens permís per consultar les dades d'Odoo. Cal el permís `use:ai`; demana'l a un administrador.",
        intent: "odoo_read",
        confidence: 0.9,
      };
    }
    return { answer: read(odoo), intent: "odoo_read", confidence: 0.9 };
  }

  if (/usuari|usuario|\busers?\b|\brols?\b|\broles\b|permis/.test(text)) {
    if (!can(user, "read:users")) {
      return { answer: "No tens permís per veure els usuaris (`read:users`).", intent: "general", confidence: 0.9 };
    }
    return { answer: platform(db), intent: "general", confidence: 0.9 };
  }
  if (/foto|album|galeria/.test(text)) return { answer: photos(db), intent: "photos_read", confidence: 0.9 };
  if (/^(hola|bon dia|bona tarda|bones|hello|hi|ei)\b|ajuda|ayuda|help|que pots|que puedes|what can/.test(text)) {
    return { answer: HELP, intent: "general", confidence: 1 };
  }
  return {
    answer: `No he sabut classificar la pregunta. ${HELP}`,
    intent: "general",
    confidence: 0.3,
  };
}
