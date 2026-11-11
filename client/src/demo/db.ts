import type { Database, SqlJsStatic, SqlValue } from "sql.js";
import { MIGRATIONS } from "./schema";

export type Params = SqlValue[];

/**
 * Embolcall mínim sobre sql.js (SQLite compilat a WebAssembly). La base viu en
 * memòria; `export()` en retorna els bytes per desar-los (vegeu `persist.ts`).
 */
export class DemoDb {
  private readonly db: Database;
  private depth = 0;

  private constructor(db: Database) {
    this.db = db;
  }

  /** Obre una base nova o una de desada i aplica les migracions pendents. */
  static open(sql: SqlJsStatic, bytes?: Uint8Array | null): DemoDb {
    const demo = new DemoDb(bytes ? new sql.Database(bytes) : new sql.Database());
    demo.pragmas();
    demo.migrate();
    return demo;
  }

  private pragmas(): void {
    this.db.run("PRAGMA foreign_keys = ON");
  }

  private migrate(): void {
    const current = Number(this.get<{ user_version: number }>("PRAGMA user_version")?.user_version ?? 0);
    for (let version = current; version < MIGRATIONS.length; version++) {
      this.transaction(() => {
        this.db.exec(MIGRATIONS[version]);
        this.db.run(`PRAGMA user_version = ${version + 1}`);
      });
    }
  }

  all<T>(sql: string, params: Params = []): T[] {
    const stmt = this.db.prepare(sql);
    try {
      stmt.bind(params);
      const rows: T[] = [];
      while (stmt.step()) rows.push(stmt.getAsObject() as T);
      return rows;
    } finally {
      stmt.free();
    }
  }

  get<T>(sql: string, params: Params = []): T | null {
    return this.all<T>(sql, params)[0] ?? null;
  }

  /** Executa una escriptura i retorna el nombre de files afectades. */
  run(sql: string, params: Params = []): number {
    this.db.run(sql, params);
    return this.db.getRowsModified();
  }

  /** Executa un INSERT i retorna l'id autoincremental de la fila nova. */
  insert(sql: string, params: Params = []): number {
    this.db.run(sql, params);
    return Number(this.get<{ id: number }>("SELECT last_insert_rowid() AS id")?.id ?? 0);
  }

  /** Transacció síncrona. Les niades s'uneixen a la de fora. */
  transaction<T>(fn: () => T): T {
    if (this.depth > 0) return fn();
    this.db.run("BEGIN");
    this.depth++;
    try {
      const result = fn();
      this.db.run("COMMIT");
      return result;
    } catch (error) {
      this.db.run("ROLLBACK");
      throw error;
    } finally {
      this.depth--;
    }
  }

  /** Bytes del fitxer SQLite. sql.js reobre la base en exportar: cal tornar a activar els PRAGMA. */
  export(): Uint8Array {
    const bytes = this.db.export();
    this.pragmas();
    return bytes;
  }
}

/** Booleà desat com a enter (SQLite no té tipus booleà). */
export function bool(value: unknown): boolean {
  return value === 1 || value === true;
}
