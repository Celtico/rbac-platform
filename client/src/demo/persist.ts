/**
 * Persistència del fitxer SQLite de la demo a IndexedDB: un sol registre amb
 * els bytes de la base, desada sencera després de cada escriptura.
 */

const IDB_NAME = "rbac-demo";
const IDB_STORE = "sqlite";
const IDB_KEY = "db";

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(IDB_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB no disponible"));
  });
}

function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openIdb().then(
    (idb) =>
      new Promise<T>((resolve, reject) => {
        const tx = idb.transaction(IDB_STORE, mode);
        const request = run(tx.objectStore(IDB_STORE));
        tx.oncomplete = () => {
          idb.close();
          resolve(request.result);
        };
        tx.onerror = tx.onabort = () => {
          idb.close();
          reject(tx.error ?? new Error("No s'han pogut desar les dades"));
        };
      }),
  );
}

export async function loadDatabaseBytes(): Promise<Uint8Array | null> {
  const stored = await withStore<unknown>("readonly", (store) => store.get(IDB_KEY));
  return stored instanceof Uint8Array ? stored : null;
}

export async function saveDatabaseBytes(bytes: Uint8Array): Promise<void> {
  await withStore("readwrite", (store) => store.put(bytes, IDB_KEY));
}

/** Esborra la base desada: la propera càrrega torna a sembrar les dades de demostració. */
export async function clearDatabase(): Promise<void> {
  await withStore("readwrite", (store) => store.delete(IDB_KEY));
}
