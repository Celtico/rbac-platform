/**
 * Esquema SQLite de la demo sense servidor.
 *
 * La primera meitat és el mateix model que el backend (entitats de TypeORM a
 * `server/src/…/entities`): usuaris, rols, permisos, tenants, galeria,
 * sessions, xat i logs. La segona és un **Odoo simulat**: les taules que
 * substitueixen l'ERP real, amb els camps que el backend demana a Odoo per
 * JSON-RPC (`server/src/odoo/odoo-client.service.ts`).
 *
 * Cada entrada és una migració; `PRAGMA user_version` en porta el compte. No
 * modifiquis una migració publicada: afegeix-ne una de nova al final.
 */
export const MIGRATIONS: readonly string[] = [
  `
  -- ── Plataforma ────────────────────────────────────────────────────────────

  CREATE TABLE permissions (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE roles (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE role_permissions (
    role_id       INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
  );

  CREATE TABLE tenants (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL UNIQUE,
    odooUrl   TEXT NOT NULL,
    odooDb    TEXT NOT NULL,
    odooUser  TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    -- SHA-256 de la contrasenya. És una demo local: no hi ha res a protegir,
    -- però tampoc es desa en clar.
    password_hash TEXT NOT NULL,
    tenantId      INTEGER REFERENCES tenants(id) ON DELETE SET NULL
  );

  CREATE TABLE user_roles (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
  );

  CREATE TABLE photos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    description TEXT,
    coverUrl    TEXT
  );

  CREATE TABLE sessions (
    id          TEXT PRIMARY KEY,
    userId      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    browser     TEXT NOT NULL,
    os          TEXT NOT NULL,
    ipAddress   TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    isRevoked   INTEGER NOT NULL DEFAULT 0,
    isNewDevice INTEGER NOT NULL DEFAULT 0,
    firstSeen   TEXT NOT NULL,
    lastSeen    TEXT NOT NULL
  );
  CREATE INDEX sessions_user_idx ON sessions (userId, lastSeen DESC);

  CREATE TABLE chat_conversations (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    userId    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title     TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE chat_messages (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    conversationId INTEGER NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    role           TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content        TEXT NOT NULL,
    intent         TEXT,
    confidence     REAL,
    createdAt      TEXT NOT NULL
  );
  CREATE INDEX chat_messages_conv_idx ON chat_messages (conversationId, id);

  CREATE TABLE logs (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    level     TEXT NOT NULL,
    message   TEXT NOT NULL,
    context   TEXT,
    timestamp TEXT NOT NULL,
    metadata  TEXT
  );

  CREATE TABLE deploy_history (
    id         TEXT PRIMARY KEY,
    timestamp  TEXT NOT NULL,
    "commit"   TEXT NOT NULL,
    version    TEXT NOT NULL,
    deployedBy TEXT NOT NULL,
    status     TEXT NOT NULL
  );

  -- ── Odoo simulat ──────────────────────────────────────────────────────────
  -- Noms de columna = noms de camp d'Odoo. Els many2one es desen com a id i es
  -- retornen com a parella [id, nom], igual que fa Odoo.

  CREATE TABLE odoo_partner (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT,
    country       TEXT,
    customer_rank INTEGER NOT NULL DEFAULT 0,
    supplier_rank INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE odoo_product (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    name              TEXT NOT NULL,
    category          TEXT NOT NULL,
    list_price        REAL NOT NULL,
    qty_available     REAL NOT NULL DEFAULT 0,
    virtual_available REAL NOT NULL DEFAULT 0,
    uom               TEXT NOT NULL DEFAULT 'Unitats',
    -- 'product' = article amb estoc; 'service' = servei.
    type              TEXT NOT NULL DEFAULT 'product',
    sale_ok           INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE odoo_sale_order (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    partner_id   INTEGER NOT NULL REFERENCES odoo_partner(id),
    amount_total REAL NOT NULL,
    date_order   TEXT NOT NULL,
    state        TEXT NOT NULL
  );

  CREATE TABLE odoo_sale_order_line (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id        INTEGER NOT NULL REFERENCES odoo_sale_order(id) ON DELETE CASCADE,
    product_id      INTEGER NOT NULL REFERENCES odoo_product(id),
    product_uom_qty REAL NOT NULL,
    price_unit      REAL NOT NULL
  );

  CREATE TABLE odoo_lead (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT NOT NULL,
    partner_id       INTEGER REFERENCES odoo_partner(id),
    expected_revenue REAL NOT NULL,
    probability      REAL NOT NULL,
    stage            TEXT NOT NULL,
    salesperson      TEXT NOT NULL,
    type             TEXT NOT NULL DEFAULT 'opportunity'
  );

  CREATE TABLE odoo_invoice (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    partner_id    INTEGER NOT NULL REFERENCES odoo_partner(id),
    amount_total  REAL NOT NULL,
    invoice_date  TEXT NOT NULL,
    payment_state TEXT NOT NULL,
    state         TEXT NOT NULL DEFAULT 'posted',
    move_type     TEXT NOT NULL DEFAULT 'out_invoice'
  );

  CREATE TABLE odoo_invoice_line (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL REFERENCES odoo_invoice(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    quantity   REAL NOT NULL,
    price_unit REAL NOT NULL
  );

  CREATE TABLE odoo_purchase_order (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    partner_id   INTEGER NOT NULL REFERENCES odoo_partner(id),
    amount_total REAL NOT NULL,
    date_order   TEXT NOT NULL,
    state        TEXT NOT NULL
  );

  CREATE TABLE odoo_employee (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    job_title  TEXT NOT NULL,
    department TEXT NOT NULL,
    work_email TEXT NOT NULL,
    active     INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE odoo_project (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    manager    TEXT NOT NULL,
    task_count INTEGER NOT NULL DEFAULT 0,
    date_start TEXT,
    date       TEXT,
    active     INTEGER NOT NULL DEFAULT 1
  );
  `,
];
