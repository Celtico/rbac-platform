/**
 * Configuració de build del client.
 *
 * `VITE_DEMO=1` construeix la **demo sense servidor** (la que es publica a
 * GitHub Pages): no hi ha backend NestJS, ni Odoo, ni OpenAI. Tot el que el
 * client demana a `/api` ho respon `src/demo/` dins del navegador, sobre una
 * base SQLite (WebAssembly) desada a IndexedDB.
 */
export const IS_DEMO = import.meta.env.VITE_DEMO === "1";

/** Arrel de l'app, sense barra final: "" al servidor propi, "/<repositori>" a GitHub Pages. */
export const BASE_PATH = import.meta.env.BASE_URL.replace(/\/+$/, "");

/** Antepon l'arrel de l'app a una ruta interna, p. ex. `/login`. */
export function appPath(path: string): string {
  return `${BASE_PATH}${path}`;
}
