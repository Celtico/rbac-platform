import initSqlJs from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { DemoDb } from "./db";
import { clearDatabase, loadDatabaseBytes, saveDatabaseBytes } from "./persist";
import { isSeeded, seed } from "./seed";

/**
 * Arrencada de la base de dades de la demo: carrega SQLite (WebAssembly),
 * recupera el fitxer desat a IndexedDB o en sembra un de nou, i el torna a
 * desar després de cada escriptura.
 */

let opening: Promise<DemoDb> | null = null;

async function open(): Promise<DemoDb> {
  const sql = await initSqlJs({ locateFile: () => wasmUrl });
  let bytes: Uint8Array | null = null;
  try {
    bytes = await loadDatabaseBytes();
  } catch {
    // Sense IndexedDB (mode privat): la demo funciona igual, però no es desa.
  }
  const db = DemoDb.open(sql, bytes);
  if (!isSeeded(db)) {
    await seed(db, new Date(), __APP_VERSION__);
    await saveNow(db);
  }
  return db;
}

/** La base de dades de la demo, oberta un sol cop per pestanya. */
export function getDb(): Promise<DemoDb> {
  opening ??= open();
  return opening;
}

async function saveNow(db: DemoDb): Promise<void> {
  try {
    await saveDatabaseBytes(db.export());
  } catch {
    // Vegeu `open`: sense IndexedDB no hi ha res a fer.
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

/** Programa el desat de la base (agrupa les escriptures seguides). */
export function scheduleSave(db: DemoDb): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void saveNow(db);
  }, 120);
}

/** Esborra totes les dades de la demo i recarrega la pàgina amb les inicials. */
export async function resetDemo(): Promise<void> {
  if (saveTimer) clearTimeout(saveTimer);
  await clearDatabase();
  localStorage.removeItem("user");
  localStorage.removeItem(SESSION_KEY);
  window.location.reload();
}

/** Clau de `localStorage` amb l'id de la sessió iniciada en aquest navegador. */
export const SESSION_KEY = "rbac-demo-session";
