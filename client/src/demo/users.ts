/** Usuaris de la demo. Es mostren a la pantalla de login, que hi entra amb un clic. */
export const DEMO_USERS = [
  { username: "admin", password: "demo1234", role: "admin", hint: "tots els permisos" },
  { username: "user", password: "demo1234", role: "user", hint: "només galeria i xat" },
] as const;
