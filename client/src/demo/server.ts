import { bool, type DemoDb } from "./db";
import { badRequest, DemoHttpError, forbidden, notFound, unauthorized } from "./errors";
import { ODOO_DOMAINS, SimulatedOdoo, type OdooDomain } from "./odoo";
import { getDb, scheduleSave, SESSION_KEY } from "./runtime";
import { sha256 } from "./seed";

/**
 * El backend de la demo: les mateixes rutes que el servidor NestJS
 * (`server/src/…/*.controller.ts`), resoltes dins del navegador contra la
 * base SQLite. `handleRequest` rep el que axios hauria enviat a `/api` i
 * retorna el cos de la resposta, o llança un `DemoHttpError`.
 */

export interface DemoRequest {
  method: string;
  /** Ruta sense el prefix `/api`, p. ex. `/users/3`. */
  path: string;
  query: Record<string, unknown>;
  body: unknown;
}

export interface DemoUser {
  id: number;
  username: string;
  roles: string[];
  permissions: string[];
}

interface Ctx {
  db: DemoDb;
  req: DemoRequest;
  params: string[];
  /** Usuari de la sessió, o `null` si no n'hi ha cap d'oberta. */
  user: DemoUser | null;
  sessionId: string | null;
}

type Handler = (ctx: Ctx) => unknown;

interface Route {
  method: string;
  pattern: RegExp;
  /** `null`: ruta pública. `""`: cal sessió. Altrament, el permís necessari. */
  permission: string | null;
  handler: Handler;
}

// ── Sessió i permisos ───────────────────────────────────────────────────────

export function loadUser(db: DemoDb, id: number): DemoUser | null {
  const row = db.get<{ id: number; username: string }>("SELECT id, username FROM users WHERE id = ?", [id]);
  if (!row) return null;
  const roles = db
    .all<{ name: string }>("SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?", [id])
    .map((r) => r.name);
  const permissions = db
    .all<{ name: string }>(
      `SELECT DISTINCT p.name FROM permissions p
         JOIN role_permissions rp ON rp.permission_id = p.id
         JOIN user_roles ur ON ur.role_id = rp.role_id
        WHERE ur.user_id = ?`,
      [id],
    )
    .map((p) => p.name);
  return { id: row.id, username: row.username, roles, permissions };
}

/** L'usuari de la sessió oberta en aquest navegador, si encara és vàlida. */
export function currentSession(db: DemoDb): { user: DemoUser; sessionId: string } | null {
  const sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) return null;
  const session = db.get<{ userId: number; isRevoked: number }>("SELECT userId, isRevoked FROM sessions WHERE id = ?", [sessionId]);
  if (!session || bool(session.isRevoked)) return null;
  const user = loadUser(db, session.userId);
  return user ? { user, sessionId } : null;
}

/** El rol `admin` ho pot tot, com al backend (`isMasterAdmin`). */
export function can(user: DemoUser, permission: string): boolean {
  return user.roles.includes("admin") || user.permissions.includes(permission);
}

export function addLog(db: DemoDb, level: string, context: string, message: string): void {
  db.run("INSERT INTO logs (level, message, context, timestamp, metadata) VALUES (?, ?, ?, ?, NULL)", [
    level,
    message,
    context,
    new Date().toISOString(),
  ]);
}

// ── Utilitats ───────────────────────────────────────────────────────────────

const str = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const obj = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !(value instanceof FormData) ? (value as Record<string, unknown>) : {};
const ids = (value: unknown): number[] => (Array.isArray(value) ? value.map(Number).filter(Number.isInteger) : []);
const int = (value: unknown, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && /UNIQUE constraint/i.test(error.message);
}

/** Executa una escriptura i tradueix el xoc de nom duplicat en un 400. */
function unique<T>(what: string, fn: () => T): T {
  try {
    return fn();
  } catch (error) {
    if (isUniqueViolation(error)) throw badRequest(`Ja existeix ${what} amb aquest nom.`);
    throw error;
  }
}

function describeBrowser(): { browser: string; os: string } {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Navegador";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "Desconegut";
  return { browser, os };
}

/** Identificador estable d'aquest navegador, per detectar "dispositiu nou". */
function deviceFingerprint(): string {
  const key = "rbac-demo-device";
  let value = localStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    localStorage.setItem(key, value);
  }
  return value;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(badRequest("No s'ha pogut llegir el fitxer."));
    reader.readAsDataURL(file);
  });
}

// ── Autenticació ────────────────────────────────────────────────────────────

async function login({ db, req }: Ctx) {
  const { username, password } = obj(req.body);
  const row = db.get<{ id: number; password_hash: string }>("SELECT id, password_hash FROM users WHERE username = ?", [str(username)]);
  if (!row || row.password_hash !== (await sha256(String(password ?? "")))) {
    addLog(db, "warn", "AuthService", `Intent de login fallit per a "${str(username)}"`);
    throw unauthorized("Usuari o contrasenya incorrectes");
  }
  const user = loadUser(db, row.id)!;
  const fingerprint = deviceFingerprint();
  // La sessió de mostra sembrada (un iPhone) no compta: els avisos de dispositiu
  // nou i de sessió concurrent només salten per sessions obertes de debò.
  const others = db.all<{ fingerprint: string }>(
    "SELECT fingerprint FROM sessions WHERE userId = ? AND isRevoked = 0 AND fingerprint != 'demo-iphone'",
    [user.id],
  );
  const hasOtherActiveSessions = others.length > 0;
  const isNewDevice = hasOtherActiveSessions && !others.some((s) => s.fingerprint === fingerprint);

  const sessionId = crypto.randomUUID();
  const now = new Date().toISOString();
  const { browser, os } = describeBrowser();
  db.run(
    `INSERT INTO sessions (id, userId, browser, os, ipAddress, fingerprint, isRevoked, isNewDevice, firstSeen, lastSeen)
     VALUES (?, ?, ?, ?, '127.0.0.1', ?, 0, ?, ?, ?)`,
    [sessionId, user.id, browser, os, fingerprint, isNewDevice ? 1 : 0, now, now],
  );
  localStorage.setItem(SESSION_KEY, sessionId);
  addLog(db, "log", "AuthService", `Login de "${user.username}" (${browser} · ${os})`);
  return { access_token: "demo", user, isNewDevice, hasOtherActiveSessions };
}

function logout({ db, sessionId }: Ctx) {
  if (sessionId) db.run("UPDATE sessions SET isRevoked = 1 WHERE id = ?", [sessionId]);
  localStorage.removeItem(SESSION_KEY);
  return { success: true };
}

function profile({ user }: Ctx) {
  return { userId: user!.id, username: user!.username, roles: user!.roles, permissions: user!.permissions };
}

// ── Usuaris, rols, permisos i tenants ───────────────────────────────────────

function userDto(db: DemoDb, id: number) {
  const row = db.get<{ id: number; username: string; tenantId: number | null }>("SELECT id, username, tenantId FROM users WHERE id = ?", [id]);
  if (!row) throw notFound(`User #${id} not found`);
  const roles = db.all<{ id: number; name: string }>(
    "SELECT r.id, r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ? ORDER BY r.name",
    [id],
  );
  return { ...row, roles };
}

function listUsers({ db }: Ctx) {
  return db.all<{ id: number }>("SELECT id FROM users ORDER BY id").map((u) => userDto(db, u.id));
}

function setUserRoles(db: DemoDb, userId: number, roleIds: number[]) {
  db.run("DELETE FROM user_roles WHERE user_id = ?", [userId]);
  for (const roleId of roleIds) {
    if (db.get("SELECT id FROM roles WHERE id = ?", [roleId])) {
      db.run("INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)", [userId, roleId]);
    }
  }
}

async function createUser({ db, req }: Ctx) {
  const body = obj(req.body);
  const username = str(body.username);
  const password = String(body.password ?? "");
  if (!username) throw badRequest("El nom d'usuari és obligatori.");
  if (password.length < 6) throw badRequest("La contrasenya ha de tenir 6 caràcters o més.");
  const hash = await sha256(password);
  const id = unique("un usuari", () =>
    db.transaction(() => {
      const newId = db.insert("INSERT INTO users (username, password_hash, tenantId) VALUES (?, ?, NULL)", [username, hash]);
      setUserRoles(db, newId, ids(body.roleIds));
      return newId;
    }),
  );
  addLog(db, "log", "UsersService", `Usuari "${username}" creat`);
  return userDto(db, id);
}

async function updateUser({ db, req, params }: Ctx) {
  const id = Number(params[0]);
  const before = userDto(db, id);
  const body = obj(req.body);
  const username = str(body.username) || before.username;
  const password = String(body.password ?? "");
  if (password && password.length < 6) throw badRequest("La contrasenya ha de tenir 6 caràcters o més.");
  const hash = password ? await sha256(password) : null;
  unique("un usuari", () =>
    db.transaction(() => {
      db.run("UPDATE users SET username = ? WHERE id = ?", [username, id]);
      if (hash) db.run("UPDATE users SET password_hash = ? WHERE id = ?", [hash, id]);
      if (Array.isArray(body.roleIds)) setUserRoles(db, id, ids(body.roleIds));
    }),
  );
  addLog(db, "log", "UsersService", `Usuari "${username}" actualitzat`);
  return userDto(db, id);
}

function deleteUser({ db, params, user }: Ctx) {
  const id = Number(params[0]);
  const target = userDto(db, id);
  if (id === user!.id) throw badRequest("No pots eliminar el teu propi usuari.");
  db.run("DELETE FROM users WHERE id = ?", [id]);
  addLog(db, "warn", "UsersService", `Usuari "${target.username}" eliminat`);
  return { success: true };
}

function roleDto(db: DemoDb, id: number) {
  const row = db.get<{ id: number; name: string }>("SELECT id, name FROM roles WHERE id = ?", [id]);
  if (!row) throw notFound(`Role #${id} not found`);
  const permissions = db.all<{ id: number; name: string }>(
    "SELECT p.id, p.name FROM permissions p JOIN role_permissions rp ON rp.permission_id = p.id WHERE rp.role_id = ? ORDER BY p.name",
    [id],
  );
  return { ...row, permissions };
}

function listRoles({ db }: Ctx) {
  return db.all<{ id: number }>("SELECT id FROM roles ORDER BY id").map((r) => roleDto(db, r.id));
}

function setRolePermissions(db: DemoDb, roleId: number, permissionIds: number[]) {
  db.run("DELETE FROM role_permissions WHERE role_id = ?", [roleId]);
  for (const permissionId of permissionIds) {
    if (db.get("SELECT id FROM permissions WHERE id = ?", [permissionId])) {
      db.run("INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [roleId, permissionId]);
    }
  }
}

function createRole({ db, req }: Ctx) {
  const body = obj(req.body);
  const name = str(body.name);
  if (!name) throw badRequest("El nom del rol és obligatori.");
  const id = unique("un rol", () =>
    db.transaction(() => {
      const newId = db.insert("INSERT INTO roles (name) VALUES (?)", [name]);
      setRolePermissions(db, newId, ids(body.permissionIds));
      return newId;
    }),
  );
  addLog(db, "log", "RolesService", `Rol "${name}" creat`);
  return roleDto(db, id);
}

function updateRole({ db, req, params }: Ctx) {
  const id = Number(params[0]);
  const before = roleDto(db, id);
  const body = obj(req.body);
  const name = str(body.name) || before.name;
  unique("un rol", () =>
    db.transaction(() => {
      db.run("UPDATE roles SET name = ? WHERE id = ?", [name, id]);
      if (Array.isArray(body.permissionIds)) setRolePermissions(db, id, ids(body.permissionIds));
    }),
  );
  addLog(db, "log", "RolesService", `Rol "${name}" actualitzat`);
  return roleDto(db, id);
}

function deleteRole({ db, params }: Ctx) {
  const id = Number(params[0]);
  const role = roleDto(db, id);
  if (role.name === "admin") throw badRequest("El rol admin no es pot eliminar.");
  db.run("DELETE FROM roles WHERE id = ?", [id]);
  addLog(db, "warn", "RolesService", `Rol "${role.name}" eliminat`);
  return { success: true };
}

function listPermissions({ db }: Ctx) {
  return db.all("SELECT id, name FROM permissions ORDER BY name");
}

function getPermission(db: DemoDb, id: number) {
  const row = db.get<{ id: number; name: string }>("SELECT id, name FROM permissions WHERE id = ?", [id]);
  if (!row) throw notFound(`Permission #${id} not found`);
  return row;
}

function createPermission({ db, req }: Ctx) {
  const name = str(obj(req.body).name);
  if (!name) throw badRequest("El nom del permís és obligatori.");
  const id = unique("un permís", () => db.insert("INSERT INTO permissions (name) VALUES (?)", [name]));
  addLog(db, "log", "PermissionsService", `Permís "${name}" creat`);
  return getPermission(db, id);
}

function updatePermission({ db, req, params }: Ctx) {
  const id = Number(params[0]);
  const before = getPermission(db, id);
  const name = str(obj(req.body).name) || before.name;
  unique("un permís", () => db.run("UPDATE permissions SET name = ? WHERE id = ?", [name, id]));
  return getPermission(db, id);
}

function deletePermission({ db, params }: Ctx) {
  const id = Number(params[0]);
  const permission = getPermission(db, id);
  db.run("DELETE FROM permissions WHERE id = ?", [id]);
  addLog(db, "warn", "PermissionsService", `Permís "${permission.name}" eliminat`);
  return { success: true };
}

function getTenant(db: DemoDb, id: number) {
  const row = db.get("SELECT id, name, odooUrl, odooDb, odooUser, createdAt FROM tenants WHERE id = ?", [id]);
  if (!row) throw notFound(`Tenant #${id} not found`);
  return row as { id: number; name: string; odooUrl: string; odooDb: string; odooUser: string; createdAt: string };
}

function listTenants({ db }: Ctx) {
  return db.all("SELECT id, name, odooUrl, odooDb, odooUser, createdAt FROM tenants ORDER BY id");
}

function createTenant({ db, req }: Ctx) {
  const body = obj(req.body);
  const name = str(body.name);
  if (!name) throw badRequest("El nom del tenant és obligatori.");
  const id = unique("un tenant", () =>
    db.insert("INSERT INTO tenants (name, odooUrl, odooDb, odooUser, createdAt) VALUES (?, ?, ?, ?, ?)", [
      name,
      str(body.odooUrl) || "sqlite://odoo-simulat",
      str(body.odooDb) || "demo",
      str(body.odooUser) || "demo",
      new Date().toISOString(),
    ]),
  );
  addLog(db, "log", "TenantsService", `Tenant "${name}" creat`);
  return getTenant(db, id);
}

function updateTenant({ db, req, params }: Ctx) {
  const id = Number(params[0]);
  const before = getTenant(db, id);
  const body = obj(req.body);
  unique("un tenant", () =>
    db.run("UPDATE tenants SET name = ?, odooUrl = ?, odooDb = ?, odooUser = ? WHERE id = ?", [
      str(body.name) || before.name,
      str(body.odooUrl) || before.odooUrl,
      str(body.odooDb) || before.odooDb,
      str(body.odooUser) || before.odooUser,
      id,
    ]),
  );
  addLog(db, "log", "TenantsService", `Tenant "${before.name}" actualitzat`);
  return getTenant(db, id);
}

function deleteTenant({ db, params }: Ctx) {
  const id = Number(params[0]);
  const tenant = getTenant(db, id);
  db.run("DELETE FROM tenants WHERE id = ?", [id]);
  addLog(db, "warn", "TenantsService", `Tenant "${tenant.name}" eliminat`);
  return { success: true };
}

// ── Galeria ─────────────────────────────────────────────────────────────────

/** Mida màxima d'una imatge pujada: es desa dins del SQLite del navegador. */
const MAX_UPLOAD_BYTES = 1_500_000;

function getPhoto(db: DemoDb, id: number) {
  const row = db.get("SELECT id, title, description, coverUrl FROM photos WHERE id = ?", [id]);
  if (!row) throw notFound(`Photo #${id} not found`);
  return row as { id: number; title: string; description: string | null; coverUrl: string | null };
}

function listPhotos({ db, req }: Ctx) {
  const page = int(req.query.page, 1);
  const limit = Math.min(int(req.query.limit, 10), 100);
  const search = `%${str(req.query.search)}%`;
  const where = "WHERE title LIKE ? OR ifnull(description, '') LIKE ?";
  const totalItems = Number(db.get<{ n: number }>(`SELECT count(*) AS n FROM photos ${where}`, [search, search])?.n ?? 0);
  const items = db.all(`SELECT id, title, description, coverUrl FROM photos ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, [
    search,
    search,
    limit,
    (page - 1) * limit,
  ]);
  return {
    items,
    meta: { totalItems, itemCount: items.length, itemsPerPage: limit, totalPages: Math.max(1, Math.ceil(totalItems / limit)), currentPage: page },
  };
}

function createPhoto({ db, req }: Ctx) {
  const body = obj(req.body);
  const title = str(body.title);
  if (!title) throw badRequest("El títol és obligatori.");
  const id = db.insert("INSERT INTO photos (title, description, coverUrl) VALUES (?, ?, ?)", [
    title,
    str(body.description) || null,
    str(body.coverUrl) || null,
  ]);
  addLog(db, "log", "PhotosService", `Àlbum "${title}" creat`);
  return getPhoto(db, id);
}

function updatePhoto({ db, req, params }: Ctx) {
  const id = Number(params[0]);
  const before = getPhoto(db, id);
  const body = obj(req.body);
  db.run("UPDATE photos SET title = ?, description = ?, coverUrl = ? WHERE id = ?", [
    str(body.title) || before.title,
    "description" in body ? str(body.description) || null : before.description,
    "coverUrl" in body ? str(body.coverUrl) || null : before.coverUrl,
    id,
  ]);
  return getPhoto(db, id);
}

function deletePhoto({ db, params }: Ctx) {
  const id = Number(params[0]);
  const photo = getPhoto(db, id);
  db.run("DELETE FROM photos WHERE id = ?", [id]);
  addLog(db, "warn", "PhotosService", `Àlbum "${photo.title}" eliminat`);
  return { success: true };
}

async function uploadPhoto({ req }: Ctx) {
  const file = req.body instanceof FormData ? req.body.get("file") : null;
  if (!(file instanceof File)) throw badRequest("No s'ha rebut cap fitxer.");
  if (!file.type.startsWith("image/")) throw badRequest("Només s'accepten imatges.");
  if (file.size > MAX_UPLOAD_BYTES) throw badRequest("A la demo les imatges es desen al navegador: màxim 1,5 MB.");
  return { url: await readFileAsDataUrl(file) };
}

/** Substitut de la recomanació amb IA: un títol i una cerca trets del text. */
function recommendAlbum({ req }: Ctx) {
  const context = str(obj(req.body).context);
  if (!context) throw badRequest("Descriu l'àlbum perquè et pugui suggerir alguna cosa.");
  const words = context.split(/\s+/).filter((w) => w.length > 3);
  const title = context.length > 40 ? `${words.slice(0, 4).join(" ")}…` : context;
  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    description: `Suggeriment de la demo (sense IA) a partir de: «${context}».`,
    imageQuery: words.slice(0, 3).join(" ") || context,
  };
}

// ── Xat (REST) ──────────────────────────────────────────────────────────────

function getConversation(db: DemoDb, id: number, userId: number) {
  const row = db.get<{ id: number; userId: number; title: string; createdAt: string; updatedAt: string }>(
    "SELECT id, userId, title, createdAt, updatedAt FROM chat_conversations WHERE id = ? AND userId = ?",
    [id, userId],
  );
  if (!row) throw notFound("Conversa no trobada");
  const messages = db.all(
    "SELECT id, conversationId, role, content, intent, confidence, createdAt FROM chat_messages WHERE conversationId = ? ORDER BY id",
    [id],
  );
  return { ...row, messages };
}

function listConversations({ db, user }: Ctx) {
  return db.all("SELECT id, userId, title, createdAt, updatedAt FROM chat_conversations WHERE userId = ? ORDER BY updatedAt DESC, id DESC", [
    user!.id,
  ]);
}

function createConversation({ db, user }: Ctx) {
  const now = new Date().toISOString();
  const id = db.insert("INSERT INTO chat_conversations (userId, title, createdAt, updatedAt) VALUES (?, 'Nova conversa', ?, ?)", [
    user!.id,
    now,
    now,
  ]);
  return getConversation(db, id, user!.id);
}

function deleteConversation({ db, params, user }: Ctx) {
  getConversation(db, Number(params[0]), user!.id);
  db.run("DELETE FROM chat_conversations WHERE id = ?", [Number(params[0])]);
  return { success: true };
}

// ── Sessions, logs, Odoo, desplegament i sistema ────────────────────────────

function listSessions({ db, user, sessionId }: Ctx) {
  return db
    .all<Record<string, unknown>>(
      "SELECT id, userId, browser, os, ipAddress, isRevoked, isNewDevice, firstSeen, lastSeen FROM sessions WHERE userId = ? AND isRevoked = 0 ORDER BY lastSeen DESC",
      [user!.id],
    )
    .map((s) => ({ ...s, isRevoked: bool(s.isRevoked), isNewDevice: bool(s.isNewDevice), isCurrent: s.id === sessionId }));
}

function revokeSession({ db, params, user }: Ctx) {
  db.run("UPDATE sessions SET isRevoked = 1 WHERE id = ? AND userId = ?", [params[0], user!.id]);
  return { success: true };
}

function revokeOtherSessions({ db, user, sessionId }: Ctx) {
  db.run("UPDATE sessions SET isRevoked = 1 WHERE userId = ? AND id != ?", [user!.id, sessionId ?? ""]);
  return { success: true };
}

function listLogs({ db, req }: Ctx) {
  const limit = Math.min(int(req.query.limit, 100), 500);
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const clauses: string[] = [];
  const params: (string | number)[] = [];
  if (str(req.query.level)) {
    clauses.push("level = ?");
    params.push(str(req.query.level));
  }
  if (str(req.query.context)) {
    clauses.push("context LIKE ?");
    params.push(`%${str(req.query.context)}%`);
  }
  if (str(req.query.search)) {
    clauses.push("message LIKE ?");
    params.push(`%${str(req.query.search)}%`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const total = Number(db.get<{ n: number }>(`SELECT count(*) AS n FROM logs ${where}`, params)?.n ?? 0);
  const entries = db
    .all<Record<string, unknown>>(`SELECT id, level, message, context, timestamp, metadata FROM logs ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, [
      ...params,
      limit,
      offset,
    ])
    .map((e) => ({ ...e, metadata: null }));
  return { entries, total, limit, offset };
}

function odooHealth({ db, user }: Ctx) {
  const tenant = db.get<{ name: string; odooUrl: string }>(
    "SELECT t.name, t.odooUrl FROM tenants t JOIN users u ON u.tenantId = t.id WHERE u.id = ?",
    [user!.id],
  ) ?? db.get<{ name: string; odooUrl: string }>("SELECT name, odooUrl FROM tenants ORDER BY id LIMIT 1");
  return { status: "ok", odoo_connected: true, odoo_url: tenant?.odooUrl ?? "sqlite://odoo-simulat", tenant: tenant?.name ?? "Default" };
}

function odooData({ db, req, params }: Ctx) {
  const domain = params[0];
  if (!(ODOO_DOMAINS as readonly string[]).includes(domain)) {
    throw notFound(`Unknown domain "${domain}". Valid: ${ODOO_DOMAINS.join(", ")}`);
  }
  const limit = req.query.limit === undefined ? undefined : Math.min(int(req.query.limit, 10), 200);
  return new SimulatedOdoo(db).rawData(domain as OdooDomain, limit);
}

const NO_DEPLOY = "Aquesta és la demo sense servidor: no hi ha res a desplegar. A l'app real, aquí es demana el desplegament al host.";

function deployVersion({ db }: Ctx) {
  const last = db.get<{ commit: string }>('SELECT "commit" FROM deploy_history ORDER BY timestamp DESC LIMIT 1');
  return { version: __APP_VERSION__, name: "rbac-platform", lastCommit: last?.commit ?? "demo", environment: "demo (navegador)" };
}

function deployHistory({ db }: Ctx) {
  return { history: db.all('SELECT id, timestamp, "commit", version, deployedBy, status FROM deploy_history ORDER BY timestamp DESC') };
}

const startedAt = Date.now();

/** Mètriques inventades però plausibles, amb una mica de moviment. */
function systemStats() {
  const wave = (period: number, phase = 0) => (Math.sin(Date.now() / period + phase) + 1) / 2;
  const memoryTotal = 8192;
  const memoryPct = 46 + wave(9000) * 8;
  const cpu = 6 + wave(4000) * 14 + Math.random() * 3;
  return {
    timestamp: Date.now(),
    cpu_pct: Math.round(cpu * 10) / 10,
    memory_used_pct: Math.round(memoryPct * 10) / 10,
    memory_used_mb: Math.round((memoryTotal * memoryPct) / 100),
    memory_total_mb: memoryTotal,
    disk_used_gb: 23.4,
    disk_total_gb: 80,
    disk_used_pct: 29.3,
    uptime_s: Math.round((Date.now() - startedAt) / 1000) + 3 * 86400,
    process_memory_mb: Math.round(140 + wave(7000, 1) * 30),
    load_avg_1m: Math.round((0.2 + wave(4000) * 0.6) * 100) / 100,
    load_avg_5m: Math.round((0.3 + wave(20000) * 0.3) * 100) / 100,
    load_avg_15m: 0.35,
    cpu_count: 4,
  };
}

// ── Taula de rutes ──────────────────────────────────────────────────────────

const ID = "(\\d+)";
const route = (method: string, path: string, permission: string | null, handler: Handler): Route => ({
  method,
  pattern: new RegExp(`^${path}$`),
  permission,
  handler,
});

const ROUTES: Route[] = [
  route("POST", "/auth/login", null, login),
  route("POST", "/auth/logout", null, logout),
  route("GET", "/auth/profile", "", profile),
  route("POST", "/auth/exchange", null, () => {
    throw badRequest("La demo no té login amb Google.");
  }),

  route("GET", "/users", "read:users", listUsers),
  route("POST", "/users", "manage:users", createUser),
  route("GET", `/users/${ID}`, "read:users", ({ db, params }) => userDto(db, Number(params[0]))),
  route("PATCH", `/users/${ID}`, "manage:users", updateUser),
  route("DELETE", `/users/${ID}`, "manage:users", deleteUser),

  route("GET", "/roles", "read:roles", listRoles),
  route("POST", "/roles", "manage:roles", createRole),
  route("GET", `/roles/${ID}`, "read:roles", ({ db, params }) => roleDto(db, Number(params[0]))),
  route("PATCH", `/roles/${ID}`, "manage:roles", updateRole),
  route("DELETE", `/roles/${ID}`, "manage:roles", deleteRole),

  route("GET", "/permissions", "read:roles", listPermissions),
  route("POST", "/permissions", "manage:roles", createPermission),
  route("GET", `/permissions/${ID}`, "read:roles", ({ db, params }) => getPermission(db, Number(params[0]))),
  route("PATCH", `/permissions/${ID}`, "manage:roles", updatePermission),
  route("DELETE", `/permissions/${ID}`, "manage:roles", deletePermission),

  route("GET", "/tenants", "read:tenants", listTenants),
  route("POST", "/tenants", "manage:tenants", createTenant),
  route("GET", `/tenants/${ID}`, "read:tenants", ({ db, params }) => getTenant(db, Number(params[0]))),
  route("PATCH", `/tenants/${ID}`, "manage:tenants", updateTenant),
  route("DELETE", `/tenants/${ID}`, "manage:tenants", deleteTenant),

  route("GET", "/photos/page-sizes", null, () => ({ pageSizes: [5, 10, 20, 50, 100] })),
  route("GET", "/photos", null, listPhotos),
  route("GET", `/photos/${ID}`, null, ({ db, params }) => getPhoto(db, Number(params[0]))),
  route("POST", "/photos/upload", "write:photos", uploadPhoto),
  route("POST", "/photos", "write:photos", createPhoto),
  route("PATCH", `/photos/${ID}`, "write:photos", updatePhoto),
  route("DELETE", `/photos/${ID}`, "write:photos", deletePhoto),
  route("POST", "/ai/recommend-album", "use:ai", recommendAlbum),

  route("GET", "/chat/conversations", "use:chat", listConversations),
  route("POST", "/chat/conversations", "use:chat", createConversation),
  route("GET", `/chat/conversations/${ID}`, "use:chat", ({ db, params, user }) => getConversation(db, Number(params[0]), user!.id)),
  route("DELETE", `/chat/conversations/${ID}`, "use:chat", deleteConversation),

  route("GET", "/sessions", "", listSessions),
  route("DELETE", "/sessions/([\\w-]+)", "", revokeSession),
  route("DELETE", "/sessions", "", revokeOtherSessions),

  route("GET", "/logs", "read:logsystem", listLogs),
  route("GET", "/logs/stream-ticket", "read:logsystem", () => {
    throw notFound("La demo no té flux de logs en directe.");
  }),

  route("GET", "/odoo/health", "use:ai", odooHealth),
  route("GET", "/odoo/data/([\\w-]+)", "use:ai", odooData),

  route("GET", "/deploy/version", "manage:deploy", deployVersion),
  route("GET", "/deploy/history", "manage:deploy", deployHistory),
  route("GET", "/deploy/logs", "manage:deploy", () => ({ logs: NO_DEPLOY })),
  route("POST", "/deploy", "manage:deploy", () => ({ message: NO_DEPLOY })),
  route("POST", "/deploy/rollback/([0-9a-fA-F]+)", "manage:deploy", () => ({ message: NO_DEPLOY })),

  route("GET", "/system/stats", "read:logsystem", systemStats),
];

/** Resol una petició a `/api` contra la base de dades de la demo. */
export async function handleRequest(req: DemoRequest): Promise<unknown> {
  const db = await getDb();
  const method = req.method.toUpperCase();
  const path = req.path.replace(/\/+$/, "") || "/";

  for (const r of ROUTES) {
    if (r.method !== method) continue;
    const match = r.pattern.exec(path);
    if (!match) continue;

    const session = currentSession(db);
    if (r.permission !== null) {
      if (!session) throw unauthorized();
      if (r.permission && !can(session.user, r.permission)) throw forbidden();
    }
    try {
      return await r.handler({ db, req, params: match.slice(1), user: session?.user ?? null, sessionId: session?.sessionId ?? null });
    } finally {
      if (method !== "GET" || path === "/auth/profile") scheduleSave(db);
    }
  }
  throw new DemoHttpError(404, `Cannot ${method} /api${path}`);
}
