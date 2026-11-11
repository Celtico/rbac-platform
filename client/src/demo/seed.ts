import type { DemoDb } from "./db";
import { DEMO_USERS } from "./users";

/**
 * Dades de demostració. Tot és inventat: ni usuaris, ni clients, ni imports
 * surten de cap instal·lació real.
 *
 * Els permisos i els rols són els mateixos que sembra el backend
 * (`server/src/common/seed.service.ts`). L'Odoo simulat és una fusteria amb
 * sis mesos d'activitat, generada amb un generador pseudoaleatori de llavor
 * fixa perquè totes les còpies de la demo comencin igual.
 */

export { DEMO_USERS };

const PERMISSIONS = [
  "read:photos",
  "write:photos",
  "read:users",
  "manage:users",
  "read:roles",
  "manage:roles",
  "use:ai",
  "write:odoo",
  "read:tenants",
  "manage:tenants",
  "manage:deploy",
  "use:chat",
  "read:logsystem",
];

const ROLES: Record<string, string[]> = {
  admin: PERMISSIONS,
  user: ["read:photos", "use:chat"],
  invitat: [],
};

const PHOTOS = [
  ["Taller de fusteria", "El banc de treball un dilluns al matí.", "workshop"],
  ["Cuina de roure", "Mobles de cos amb fronts de roure natural.", "kitchen"],
  ["Prestatgeria a mida", "Sis mòduls de 80 cm tallats a la CNC.", "shelf"],
  ["Taula de noguera", "Sobre massís de 240 × 100 cm.", "table"],
  ["Armari encastat", "Portes corredisses lacades.", "wardrobe"],
  ["Detall de cua d'oreneta", "Calaixos units sense ferramenta.", "joinery"],
  ["Escala de faig", "Graons volats amb barana de vidre.", "stairs"],
  ["Moble de bany", "Tauler hidròfug amb xapa de teca.", "bathroom"],
];

const CUSTOMERS = [
  ["Mobles Segrià SL", "ES"],
  ["Construccions Ponent SA", "ES"],
  ["Hotel Vall d'Aran", "ES"],
  ["Interiorisme Garriga", "ES"],
  ["Restaurant El Celler", "ES"],
  ["Arquitectes Urgell", "ES"],
  ["Cuines Pirineu SL", "ES"],
  ["Ajuntament de Vilanova", "ES"],
  ["Estudi Noguera", "ES"],
  ["Menuiserie Roussillon", "FR"],
  ["Casa Rural Montsec", "ES"],
  ["Oficines Pla d'Urgell", "ES"],
  ["Botiga La Fusta", "ES"],
  ["Promocions Cinca SL", "ES"],
];

const SUPPLIERS = ["Fustes Solsonès SA", "Taulers Ebre SL", "Ferramenta Lleidatana", "Vernissos Catalunya", "Maquinària CNC Ibèrica"];

// [nom, categoria, preu, estoc, tipus]
const PRODUCTS: [string, string, number, number, "product" | "service"][] = [
  ["Tauler de roure 19 mm", "Taulers", 86.5, 42, "product"],
  ["Tauler de faig 19 mm", "Taulers", 72.0, 35, "product"],
  ["Tauler melamina blanca 16 mm", "Taulers", 24.9, 120, "product"],
  ["Tauler hidròfug 19 mm", "Taulers", 41.3, 8, "product"],
  ["Sobre de noguera massís", "Massissos", 640.0, 6, "product"],
  ["Llistó de pi 45 × 45", "Massissos", 7.8, 260, "product"],
  ["Moble de cos baix 60", "Mobles", 185.0, 14, "product"],
  ["Moble de cos alt 80", "Mobles", 210.0, 9, "product"],
  ["Prestatgeria modular", "Mobles", 320.0, 11, "product"],
  ["Armari de dues portes", "Mobles", 540.0, 4, "product"],
  ["Frontissa de cassoleta", "Ferramenta", 3.2, 900, "product"],
  ["Guia de calaix 500 mm", "Ferramenta", 14.6, 3, "product"],
  ["Vernís a l'aigua 5 L", "Acabats", 58.0, 22, "product"],
  ["Tall a mida CNC", "Serveis", 45.0, 0, "service"],
  ["Muntatge a domicili", "Serveis", 60.0, 0, "service"],
  ["Disseny i plànols", "Serveis", 380.0, 0, "service"],
];

const EMPLOYEES = [
  ["Marta Solé", "Directora general", "Direcció"],
  ["Jordi Pujol Vidal", "Cap de taller", "Producció"],
  ["Laia Ferrer", "Fustera", "Producció"],
  ["Pau Riba", "Operari CNC", "Producció"],
  ["Núria Bosch", "Operària CNC", "Producció"],
  ["Oriol Camps", "Muntador", "Producció"],
  ["Anna Roca", "Dissenyadora", "Oficina tècnica"],
  ["Marc Sala", "Delineant", "Oficina tècnica"],
  ["Carla Mir", "Comercial", "Vendes"],
  ["Arnau Font", "Comercial", "Vendes"],
  ["Júlia Vila", "Administrativa", "Administració"],
  ["Pere Coll", "Comptable", "Administració"],
  ["Sílvia Puig", "Compres", "Administració"],
  ["Roger Mas", "Aprenent", "Producció"],
];

const PROJECTS: [string, string, number][] = [
  ["Cuines Hotel Vall d'Aran", "Jordi Pujol Vidal", 24],
  ["Biblioteca municipal de Vilanova", "Anna Roca", 31],
  ["Reforma Restaurant El Celler", "Jordi Pujol Vidal", 12],
  ["Oficines Pla d'Urgell", "Marc Sala", 18],
  ["Catàleg 2027", "Carla Mir", 9],
  ["Posada en marxa CNC nova", "Pau Riba", 7],
];

const LEADS: [string, number, number, string][] = [
  ["Mobiliari per a 40 habitacions", 68000, 60, "Proposta"],
  ["Cuina professional", 21500, 80, "Negociació"],
  ["Prestatgeries per a arxiu", 12800, 30, "Qualificat"],
  ["Reforma integral d'oficines", 46000, 50, "Proposta"],
  ["Taules per a sala de reunions", 8400, 90, "Negociació"],
  ["Armaris encastats promoció Cinca", 54000, 20, "Nou"],
  ["Barra i rebost de restaurant", 17300, 70, "Proposta"],
  ["Mobles de bany a mida", 6900, 40, "Qualificat"],
  ["Escala i barana de faig", 11200, 100, "Guanyat"],
  ["Botiga pop-up", 4300, 10, "Nou"],
  ["Parament de fusta per a vestíbul", 15600, 55, "Proposta"],
  ["Dotació d'aules", 29800, 35, "Qualificat"],
];

/** Generador pseudoaleatori determinista (mulberry32). */
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

export async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

const slug = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

/** `true` si la base ja té dades (no cal tornar a sembrar). */
export function isSeeded(db: DemoDb): boolean {
  return (db.get<{ n: number }>("SELECT count(*) AS n FROM users")?.n ?? 0) > 0;
}

export async function seed(db: DemoDb, now: Date, appVersion: string): Promise<void> {
  const hashes = new Map<string, string>();
  for (const u of DEMO_USERS) hashes.set(u.username, await sha256(u.password));

  const rand = mulberry32(20260911);
  const pick = <T,>(items: readonly T[]): T => items[Math.floor(rand() * items.length)];
  const daysAgo = (days: number, hour = 10): string => {
    const d = new Date(now.getTime() - days * 86_400_000);
    d.setHours(hour, Math.floor(rand() * 60), 0, 0);
    return d.toISOString();
  };
  const dateOnly = (iso: string) => iso.slice(0, 10);
  const odooDateTime = (iso: string) => iso.slice(0, 19).replace("T", " ");

  db.transaction(() => {
    // ── Plataforma ──────────────────────────────────────────────────────────
    const permissionId = new Map<string, number>();
    for (const name of PERMISSIONS) {
      permissionId.set(name, db.insert("INSERT INTO permissions (name) VALUES (?)", [name]));
    }
    const roleId = new Map<string, number>();
    for (const [name, perms] of Object.entries(ROLES)) {
      const id = db.insert("INSERT INTO roles (name) VALUES (?)", [name]);
      roleId.set(name, id);
      for (const p of perms) {
        db.run("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [id, permissionId.get(p)!]);
      }
    }

    const defaultTenant = db.insert(
      "INSERT INTO tenants (name, odooUrl, odooDb, odooUser, createdAt) VALUES (?, ?, ?, ?, ?)",
      ["Default", "sqlite://odoo-simulat", "fusteria_demo", "admin", daysAgo(190)],
    );
    db.insert("INSERT INTO tenants (name, odooUrl, odooDb, odooUser, createdAt) VALUES (?, ?, ?, ?, ?)", [
      "Fusteria Ponent",
      "sqlite://odoo-simulat",
      "fusteria_ponent",
      "api",
      daysAgo(64),
    ]);

    const userId = new Map<string, number>();
    for (const u of DEMO_USERS) {
      const id = db.insert("INSERT INTO users (username, password_hash, tenantId) VALUES (?, ?, ?)", [
        u.username,
        hashes.get(u.username)!,
        u.role === "admin" ? defaultTenant : null,
      ]);
      userId.set(u.username, id);
      db.run("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", [id, roleId.get(u.role)!]);
    }

    for (const [title, description, key] of PHOTOS) {
      db.run("INSERT INTO photos (title, description, coverUrl) VALUES (?, ?, ?)", [
        title,
        description,
        `https://picsum.photos/seed/rbac-${key}/800/600`,
      ]);
    }

    // Una sessió anterior de l'admin en un altre dispositiu, perquè el gestor
    // de dispositius i l'avís de sessió concurrent tinguin alguna cosa a ensenyar.
    db.run(
      `INSERT INTO sessions (id, userId, browser, os, ipAddress, fingerprint, isRevoked, isNewDevice, firstSeen, lastSeen)
       VALUES (?, ?, 'Safari', 'iOS', '198.51.100.24', 'demo-iphone', 0, 1, ?, ?)`,
      ["demo-session-iphone", userId.get("admin")!, daysAgo(3, 19), daysAgo(1, 22)],
    );

    const conv = db.insert("INSERT INTO chat_conversations (userId, title, createdAt, updatedAt) VALUES (?, ?, ?, ?)", [
      userId.get("admin")!,
      "Benvinguda a la demo",
      daysAgo(0, 8),
      daysAgo(0, 8),
    ]);
    db.run(
      "INSERT INTO chat_messages (conversationId, role, content, intent, confidence, createdAt) VALUES (?, 'assistant', ?, 'general', 1, ?)",
      [
        conv,
        "Hola! Soc l'assistent d'aquesta demo. Aquí **no hi ha cap model d'IA**: responc amb regles sobre un Odoo simulat en SQLite que viu al teu navegador.\n\nProva de preguntar-me:\n\n- Com van les vendes?\n- Quines factures tenim pendents?\n- Quin és el producte més venut?\n- Crea una factura per a Hotel Vall d'Aran de 3 Prestatgeria modular\n- Quants usuaris hi ha?",
        daysAgo(0, 8),
      ],
    );

    const bootLogs: [string, string, string][] = [
      ["log", "NestFactory", "Starting Nest application... (simulat: aquesta demo no té servidor)"],
      ["log", "InstanceLoader", "TypeOrmModule dependencies initialized"],
      ["log", "SeedService", "Seeding/Sync complete."],
      ["log", "TenantsService", 'Tenant "Default" → sqlite://odoo-simulat'],
      ["warn", "OdooClientService", "Odoo real no disponible: s'utilitza l'Odoo simulat en SQLite"],
      ["log", "NestApplication", "Nest application successfully started"],
    ];
    bootLogs.forEach(([level, context, message], i) => {
      db.run("INSERT INTO logs (level, message, context, timestamp, metadata) VALUES (?, ?, ?, ?, NULL)", [
        level,
        message,
        context,
        new Date(now.getTime() - (bootLogs.length - i) * 400).toISOString(),
      ]);
    });

    const versions = appVersion.split(".").map(Number);
    const patch = versions[2] ?? 0;
    ["a4c08d9", "b5fcb8e", "d30e263"].forEach((commit, i) => {
      db.run('INSERT INTO deploy_history (id, timestamp, "commit", version, deployedBy, status) VALUES (?, ?, ?, ?, ?, ?)', [
        `demo-deploy-${i}`,
        daysAgo(i * 6 + 1, 17),
        commit,
        `${versions[0] ?? 0}.${versions[1] ?? 0}.${Math.max(0, patch - i)}`,
        "admin",
        "success",
      ]);
    });

    // ── Odoo simulat ────────────────────────────────────────────────────────
    const customerIds = CUSTOMERS.map(([name, country], i) =>
      db.insert("INSERT INTO odoo_partner (name, email, country, customer_rank, supplier_rank) VALUES (?, ?, ?, ?, 0)", [
        name,
        `comandes@${slug(name)}.example`,
        country === "FR" ? "França" : "Espanya",
        CUSTOMERS.length - i,
      ]),
    );
    const supplierIds = SUPPLIERS.map((name, i) =>
      db.insert("INSERT INTO odoo_partner (name, email, country, customer_rank, supplier_rank) VALUES (?, ?, 'Espanya', 0, ?)", [
        name,
        `vendes@${slug(name)}.example`,
        SUPPLIERS.length - i,
      ]),
    );
    const productIds = PRODUCTS.map(([name, category, price, qty, type]) =>
      db.insert(
        "INSERT INTO odoo_product (name, category, list_price, qty_available, virtual_available, uom, type, sale_ok) VALUES (?, ?, ?, ?, ?, ?, ?, 1)",
        [name, category, price, qty, type === "service" ? 0 : Math.max(0, qty - Math.floor(rand() * 6)), type === "service" ? "Hores" : "Unitats", type],
      ),
    );

    // Comandes de venda: unes 44 en sis mesos, amb els primers clients comprant més sovint.
    for (let n = 0; n < 44; n++) {
      const customer = customerIds[Math.floor(rand() * rand() * customerIds.length)];
      const date = daysAgo(Math.floor(rand() * 180), 9 + Math.floor(rand() * 8));
      const lines = 1 + Math.floor(rand() * 3);
      const orderId = db.insert(
        "INSERT INTO odoo_sale_order (name, partner_id, amount_total, date_order, state) VALUES (?, ?, 0, ?, ?)",
        [`S${String(n + 1).padStart(5, "0")}`, customer, odooDateTime(date), rand() < 0.75 ? "sale" : "done"],
      );
      let total = 0;
      for (let l = 0; l < lines; l++) {
        const index = Math.floor(rand() * PRODUCTS.length);
        const qty = PRODUCTS[index][4] === "service" ? 1 + Math.floor(rand() * 8) : 1 + Math.floor(rand() * 12);
        const price = PRODUCTS[index][2];
        total += qty * price;
        db.run("INSERT INTO odoo_sale_order_line (order_id, product_id, product_uom_qty, price_unit) VALUES (?, ?, ?, ?)", [
          orderId,
          productIds[index],
          qty,
          price,
        ]);
      }
      db.run("UPDATE odoo_sale_order SET amount_total = ? WHERE id = ?", [Math.round(total * 121) / 100, orderId]);
    }

    // Factures de client: una per a la majoria de comandes, amb les recents encara per cobrar.
    const orders = db.all<{ partner_id: number; amount_total: number; date_order: string }>(
      "SELECT partner_id, amount_total, date_order FROM odoo_sale_order ORDER BY date_order",
    );
    orders.forEach((order, i) => {
      if (rand() < 0.2) return;
      const ageDays = (now.getTime() - new Date(order.date_order.replace(" ", "T") + "Z").getTime()) / 86_400_000;
      const paymentState = ageDays > 45 ? (rand() < 0.9 ? "paid" : "not_paid") : rand() < 0.45 ? "paid" : rand() < 0.7 ? "not_paid" : "partial";
      const invoiceId = db.insert(
        "INSERT INTO odoo_invoice (name, partner_id, amount_total, invoice_date, payment_state, state, move_type) VALUES (?, ?, ?, ?, ?, 'posted', 'out_invoice')",
        [`FAC/${now.getFullYear()}/${String(i + 1).padStart(5, "0")}`, order.partner_id, order.amount_total, dateOnly(order.date_order), paymentState],
      );
      db.run("INSERT INTO odoo_invoice_line (invoice_id, name, quantity, price_unit) VALUES (?, 'Comanda de venda', 1, ?)", [
        invoiceId,
        Math.round((order.amount_total / 1.21) * 100) / 100,
      ]);
    });

    for (let n = 0; n < 14; n++) {
      db.run("INSERT INTO odoo_purchase_order (name, partner_id, amount_total, date_order, state) VALUES (?, ?, ?, ?, ?)", [
        `P${String(n + 1).padStart(5, "0")}`,
        pick(supplierIds),
        Math.round((400 + rand() * 5200) * 100) / 100,
        odooDateTime(daysAgo(Math.floor(rand() * 150), 11)),
        rand() < 0.7 ? "purchase" : "done",
      ]);
    }

    const salespeople = ["Carla Mir", "Arnau Font"];
    LEADS.forEach(([name, revenue, probability, stage], i) => {
      db.run(
        "INSERT INTO odoo_lead (name, partner_id, expected_revenue, probability, stage, salesperson, type) VALUES (?, ?, ?, ?, ?, ?, 'opportunity')",
        [name, customerIds[i % customerIds.length], revenue, probability, stage, salespeople[i % 2]],
      );
    });

    for (const [name, job, department] of EMPLOYEES) {
      db.run("INSERT INTO odoo_employee (name, job_title, department, work_email, active) VALUES (?, ?, ?, ?, 1)", [
        name,
        job,
        department,
        `${slug(name.split(" ")[0])}.${slug(name.split(" ")[1] ?? "")}@fusteria.example`,
      ]);
    }

    PROJECTS.forEach(([name, manager, tasks], i) => {
      db.run("INSERT INTO odoo_project (name, manager, task_count, date_start, date, active) VALUES (?, ?, ?, ?, ?, 1)", [
        name,
        manager,
        tasks,
        dateOnly(daysAgo(120 - i * 15)),
        dateOnly(new Date(now.getTime() + (20 + i * 25) * 86_400_000).toISOString()),
      ]);
    });
  });
}
