import { Injectable, Logger } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { OdooClientService } from './odoo-client.service';
import { OdooConfig } from './guards/tenant.guard';

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const ROUTER_PROMPT = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are an intelligent router for an Odoo ERP system.
Given the user's question, classify it into EXACTLY ONE of these intents:

- sales       → sales orders, revenue, quotes
- customers   → client list, customer details, contacts
- products    → catalogue, prices, categories
- crm         → leads, opportunities, pipeline, conversion
- stock       → inventory, warehouse, stock levels, availability
- invoices    → billing, payments, accounting, overdue
- purchases   → purchase orders, suppliers, procurement
- employees   → HR, staff, departments, headcount
- projects    → tasks, project status, deadlines
- kpis        → dashboard, summary, general overview, key metrics
- unknown     → anything outside the ERP domain

Reply with a JSON object (no markdown):
{{"intent": "<intent>", "confidence": <0.0-1.0>}}`,
  ],
  ['human', '{question}'],
]);

const ANALYST_PROMPT = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a senior ERP business analyst working with Odoo data.
You will receive the user's question and a JSON payload with live data from the Odoo database.

- ALWAYS respond in Catalan, regardless of the language the user writes in.
- Answer clearly and concisely.
- Highlight key insights, totals, trends, or anomalies where relevant.
- Format numbers clearly (currency symbols, percentages, etc.).
- Never invent data — only use what is provided.
- Keep the tone professional but approachable.

OBLIGATORI quan hi ha valors numèrics: comença la resposta amb UN bloc de gràfica.
Exemple per vendes per producte:

:::chart
{{"type":"bar","title":"Vendes per producte","data":[{{"name":"Producte A","value":1200}},{{"name":"Producte B","value":850}}],"series":[{{"name":"value","color":"purple.500"}}]}}
:::

Regles: usa "bar" per comparacions, "barlist" per rànquings, "pie" per distribucions (ex: estat factures),
"line" per evolució temporal amb "xKey" pel camp de data. Substitueix sempre pels valors reals de les dades.
Després del bloc, afegeix l'explicació en text. Si no hi ha números rellevants, no afegeixis el bloc.`,
  ],
  ['human', 'Question: {question}\n\nOdoo data:\n{data}'],
]);

const FALLBACK_PROMPT = ChatPromptTemplate.fromMessages([
  [
    'system',
    'You are a helpful assistant for an Odoo ERP demo system. ' +
      'ALWAYS respond in Catalan. Answer briefly and suggest what the user could ask instead.',
  ],
  ['human', '{question}'],
]);

type OdooIntent =
  | 'sales' | 'customers' | 'products' | 'crm' | 'stock'
  | 'invoices' | 'purchases' | 'employees' | 'projects' | 'kpis' | 'unknown';

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface OrchestratorResult {
  answer: string;
  intent: string;
  confidence: number;
  tenant?: string;
  raw_data?: unknown;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class OdooOrchestratorService {
  private readonly logger = new Logger(OdooOrchestratorService.name);

  private readonly llm: ChatOpenAI;
  private readonly routerChain;
  private readonly analystChain;
  private readonly fallbackChain;

  constructor(private readonly odoo: OdooClientService) {
    this.llm = new ChatOpenAI({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      temperature: 0,
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.routerChain = ROUTER_PROMPT.pipe(this.llm);
    this.analystChain = ANALYST_PROMPT.pipe(this.llm);
    this.fallbackChain = FALLBACK_PROMPT.pipe(this.llm);
  }

  async query(
    cfg: OdooConfig,
    question: string,
    includeRawData = false,
  ): Promise<OrchestratorResult> {
    const { intent, confidence } = await this.route(question);
    this.logger.log(
      `[${cfg.tenantName ?? 'default'}] "${question}" → ${intent} (${(confidence * 100).toFixed(0)}%)`,
    );

    const rawData = await this.fetchData(cfg, intent as OdooIntent);

    if (rawData === null) {
      const res = await this.fallbackChain.invoke({ question });
      return {
        answer: res.content as string,
        intent,
        confidence,
        tenant: cfg.tenantName,
      };
    }

    const data = JSON.stringify(rawData, null, 2);
    const res = await this.analystChain.invoke({ question, data });

    return {
      answer: res.content as string,
      intent,
      confidence,
      tenant: cfg.tenantName,
      raw_data: includeRawData ? rawData : undefined,
    };
  }

  async getRawData(
    cfg: OdooConfig,
    domain: string,
    limit = 10,
  ): Promise<unknown> {
    try {
      switch (domain) {
        case 'sales':     return await this.odoo.getSales(cfg, limit);
        case 'customers': return await this.odoo.getCustomers(cfg, limit);
        case 'products':  return await this.odoo.getProducts(cfg, limit);
        case 'crm':       return await this.odoo.getCrmLeads(cfg, limit);
        case 'stock':     return await this.odoo.getStock(cfg, limit);
        case 'invoices':  return await this.odoo.getInvoices(cfg, limit);
        case 'purchases': return await this.odoo.getPurchases(cfg, limit);
        case 'employees': return await this.odoo.getEmployees(cfg, limit);
        case 'projects':  return await this.odoo.getProjects(cfg, limit);
        case 'kpis':      return await this.odoo.getKpis(cfg);
        default:
          throw new Error(`Unknown domain "${domain}"`);
      }
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes('Unknown domain')) throw err;
      this.logger.warn(
        `Odoo module unavailable for domain "${domain}" (tenant "${cfg.tenantName}"): ${msg}`,
      );
      return { error: msg };
    }
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private async route(
    question: string,
  ): Promise<{ intent: string; confidence: number }> {
    try {
      const res = await this.routerChain.invoke({ question });
      const parsed = JSON.parse(res.content as string);
      return {
        intent: parsed.intent ?? 'unknown',
        confidence: Number(parsed.confidence ?? 0),
      };
    } catch (err) {
      this.logger.warn(`Router parse error: ${err}`);
      return { intent: 'unknown', confidence: 0 };
    }
  }

  private async fetchData(
    cfg: OdooConfig,
    intent: OdooIntent,
  ): Promise<unknown> {
    try {
      switch (intent) {
        case 'sales':     return await this.odoo.getSales(cfg);
        case 'customers': return await this.odoo.getCustomers(cfg);
        case 'products':  return await this.odoo.getProducts(cfg);
        case 'crm':       return await this.odoo.getCrmLeads(cfg);
        case 'stock':     return await this.odoo.getStock(cfg);
        case 'invoices':  return await this.odoo.getInvoices(cfg);
        case 'purchases': return await this.odoo.getPurchases(cfg);
        case 'employees': return await this.odoo.getEmployees(cfg);
        case 'projects':  return await this.odoo.getProjects(cfg);
        case 'kpis':      return await this.odoo.getKpis(cfg);
        default:          return null;
      }
    } catch (err) {
      this.logger.warn(
        `Odoo module unavailable for intent "${intent}" (tenant "${cfg.tenantName}"): ${(err as Error).message}`,
      );
      return null;
    }
  }
}
