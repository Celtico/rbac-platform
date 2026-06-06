# SECURITY.md

Informe de seguretat i deute tècnic del projecte **album-manager** (NestJS + React/Vite + SQLite + Odoo).

Data de la revisió: 2026-06-06 · Branca: `fix/critical-security`

Les troballes estan ordenades per prioritat. Cada entrada indica **fitxer\:línia**, l'impacte i la correcció recomanada. Marca la casella quan estigui resolta.

> Llegenda de severitat: 🔴 Crític · 🟠 Alt · 🟡 Mitjà · 🟢 Baix / deute tècnic

---

## Verificació dinàmica (local, 2026-06-06)

Es va muntar el backend en local amb una **BD nova de prova** (la BD original es va apartar i restaurar; no es va tocar producció). Resultats confirmats en execució:

| Troballa | Comprovació | Resultat |
|----------|-------------|----------|
| **C2** | Login amb credencials per defecte sobre BD buida | ✅ Confirmat — `admin`/`adminpassword` i `celticopetit@gmail.com`/`celticopetit@gmail.com` retornen un JWT d'admin. Una BD nova sembra credencials febles. |
| **A1** | Connexió WebSocket `/chat` amb token de sessió revocada | ✅ Confirmat — REST retorna `401` després de revocar, però el WS **segueix connectant** amb el mateix token. |
| **A3** (headers) | Capçaleres de resposta | ✅ Confirmat — `X-Powered-By: Express`, cap header de `helmet` (`X-Content-Type-Options`, etc.). |
| **A3** (rate limit) | 20 logins fallits seguits | ✅ Confirmat — tots `401`, cap `429`. Sense throttling. |
| **M6** | Petició amb `Origin: https://atacant.example` | ✅ Confirmat — resposta `Access-Control-Allow-Origin: https://atacant.example` + `Allow-Credentials: true`. |
| **M3** | `GET /api/system/stats` amb usuari `user` | ✅ Confirmat — `HTTP 200`, retorna CPU/mem/disc/uptime del host sense permís. |
| **M1** | Descodificació del payload JWT | ✅ Confirmat — el token incrusta `roles` i `permissions`; revocar-los no té efecte fins l'expiració. |
| **B2** | `GET /api/docs` sense autenticació | ✅ Confirmat — `HTTP 200`, Swagger públic. |

> Nota positiva observada: quan la sessió **sí existeix** i es revoca, el middleware bloqueja correctament les peticions REST següents (falla en tancat). El forat d'A2 és només quan **no** es troba cap sessió per al token.
>
> No verificades dinàmicament (intencionadament, per evitar efectes irreversibles en producció/ERP): **C1** (socket Docker → no es va executar el deploy), **C3/C4** (crear factures reals a Odoo) i **A4** (sense tenant Odoo configurat en local). Es mantenen confirmades per anàlisi estàtica del codi.

---

## 🔴 Crítics — actuar immediatament

### [x] C1 · Escapada del contenidor / RCE al host via el socket de Docker — ✅ Resolt (MR !37, requereix instal·lar el watcher al host)
- **On:** `docker-compose.yaml:16`, `deploy.sh:62-67`, `deploy/deploy.controller.ts`
- **Risc:** El contenidor de l'app munta `/var/run/docker.sock`, i `deploy.sh` aixeca un contenidor amb control total de Docker. Qualsevol usuari amb el permís `manage:deploy` (o el rol `admin`) que cridi `POST /api/deploy` obté efectivament **root al host**. És el risc més greu del projecte.
- **Correcció:** Treure el muntatge del socket de Docker del contenidor de l'app. Moure el desplegament fora de l'aplicació web (webhook/CI executat al host, GitHub Actions, o un agent de desplegament aïllat). L'app web mai hauria de poder controlar Docker.

### [x] C2 · Contrasenyes de seed febles hardcoded al codi font (risc en desplegaments nous) — ✅ Resolt (MR !32)
- **On:** `common/seed.service.ts:115-143`
- **Estat a producció:** **Parcialment mitigat.** El seed és *crea-si-no-existeix* (`if (!existingUsers.find(...))`) i la BD viu en un volum persistent (`docker-compose.yaml`: `./data:/app/data`). Les contrasenyes de la instància de producció **ja s'han canviat manualment** i un rebuild/redeploy **no les sobreescriu** (el seed troba els usuaris i no fa res). El superadmin existeix i té credencials pròpies.
- **Risc residual:** Les contrasenyes per defecte segueixen al codi font: `admin`/`adminpassword`, `user`/`userpassword` i `celticopetit@gmail.com` **amb contrasenya igual al nom d'usuari** (`seed.service.ts:118`). Qualsevol **desplegament nou amb BD buida**, o la pèrdua/recreació del volum `data/`, tornaria a sembrar aquestes credencials febles **silenciosament**. Tenir `password = username` per a un compte amb rol `admin` com a *default* és especialment perillós.
- **Correcció:** Treure les contrasenyes hardcoded; llegir-les d'env vars obligatòries (p. ex. `SEED_ADMIN_PASSWORD`) i **avortar l'arrencada si no es proporcionen** en producció. Forçar canvi de contrasenya al primer accés. Així el comportament idempotent actual es manté, però un desplegament net mai crea credencials febles.

### [x] C3 · El xat IA pot crear i comptabilitzar factures reals a Odoo sense permís específic — ✅ Resolt (MR !36)
- **On:** `chat/chat-orchestrator.service.ts` (`DOMAIN_PERMISSIONS`, `handleCreateInvoice`), `odoo/odoo-client.service.ts:338-368`
- **Risc:** Els dominis `odoo_read` i `odoo_action` comparteixen el mateix permís `use:ai`. Qualsevol usuari amb xat IA pot provocar `account.move` create + `action_post` (factura legalment vàlida). L'única "validació" és la classificació de l'LLM i un `includes('factura')`.
- **Correcció:** Crear un permís separat per a escriptures (`odoo:action` / `write:odoo`) i exigir-lo per a `odoo_action`. Afegir un pas de confirmació explícit de l'usuari abans de qualsevol acció d'escriptura.

### [x] C4 · Paràmetres extrets per l'LLM van sense validar a escriptures d'Odoo + prompt injection — ✅ Resolt (MR !36)
- **On:** `chat/chat-orchestrator.service.ts:266-330`, routers a `chat-orchestrator.service.ts:472` i `odoo/odoo-orchestrator.service.ts:185`
- **Risc:** Els `params` venen de `JSON.parse(LLM output)` i s'usen per crear factures (partner, quantitats, preus) sense comprovar que `lines` sigui array ni que els números siguin finits/positius. L'input d'usuari i l'historial s'interpolen crus als prompts → **prompt injection** pot canviar el domini/intenció i facturar un partner arbitrari o trencar el flux.
- **Correcció:** Validar la sortida de l'LLM amb un esquema (zod) abans de qualsevol crida a Odoo. Tractar la sortida de l'LLM com a **dada no fiable**, mai com a font d'autorització ni de paràmetres d'escriptura. Delimitar l'input d'usuari i instruir el model a no seguir instruccions incrustades.

---

## 🟠 Alts

### [x] A1 · El WebSocket del xat ignora la revocació de sessions — ✅ Resolt (MR !33)
- **On:** `chat/chat.gateway.ts:49-64`, `sessions/sessions.middleware.ts`
- **Risc:** El gateway només fa `jwtService.verify(token)`; el `SessionValidationMiddleware` només corre sobre rutes Express, no sobre Socket.io. Un token revocat des del DeviceManager segueix funcionant al xat fins que expira (1 dia). Trenca la garantia documentada de revocació immediata.
- **Correcció:** A `handleConnection`, fer hash sha256 del token i rebutjar si `findByHash` no existeix o `isRevoked`. Idealment, revalidar a cada `chat:send`.

### [x] A2 · El middleware de sessions falla en obert — ✅ Resolt (MR !33)
- **On:** `sessions/sessions.middleware.ts:31`, `auth/auth.service.ts:50-52`
- **Risc:** Si no troba sessió, deixa passar la petició. Com que `login()` empassa errors de creació de sessió, pot existir un JWT vàlid sense fila de sessió → bypass total de la revocació.
- **Correcció:** Fallar en tancat un cop el sistema de sessions està operatiu (exigir sessió no revocada per a tota petició autenticada). No empassar errors de creació de sessió.

### [x] A3 · Sense rate limiting ni headers de seguretat — ✅ Resolt (MR !31)
- **On:** `main.ts` (configuració global)
- **Risc:** No hi ha `@nestjs/throttler` ni `helmet`. Login, deploy i el stream de logs queden oberts a força bruta i DoS.
- **Correcció:** Afegir `@nestjs/throttler` amb `ThrottlerGuard` global (límits més estrictes a `auth` i `deploy`) i `helmet()` global.

### [x] A4 · Contrasenyes d'Odoo en text pla a la BD — ✅ Resolt (MR !34)
- **On:** `tenants/entities/tenant.entity.ts:27-28`, `tenants/tenants.service.ts`
- **Risc:** `odooPassword` només té `select: false` (no és xifrat). Amb accés al fitxer `data/db.sqlite` (vegeu C1) s'obtenen totes les credencials ERP.
- **Correcció:** Xifrar en repòs (AES-GCM amb clau d'env/KMS) abans de persistir; desxifrar només a `findOneWithCredentials`.

### [~] A5 · JWT a `localStorage` + sortida LLM renderitzada sense sanititzar — 🟡 Gairebé (MR !35, !42)
- **On:** `client/src/api/index.ts`, `client/src/context/AuthContext.tsx`, `client/src/pages/GlobalChat.tsx`, `server/src/auth/*`
- **Risc:** El JWT viu a `localStorage`, robable per qualsevol XSS. El markdown de la sortida LLM es renderitzava sense `rehype-sanitize`.
- ✅ **Fet (MR !35):** sanitització del markdown amb `rehype-sanitize` + component `a` que només permet `http(s)`/`mailto`. Verificat.
- ✅ **Fet (MR !42, dual-mode):** el login/OAuth posen una cookie `HttpOnly; Secure; SameSite=Lax`; backend i frontend l'accepten (dual amb el header). Verificat al backend (auth només-cookie funciona, logout la neteja).
- ⏳ **Pendent (cutover):** retirar del tot el JWT de `localStorage` (i fer que el WS handshake llegeixi la cookie) per eliminar l'exposició XPS residual. Diferit perquè requereix validació en navegador.

---

## 🟡 Mitjans

### [x] M1 · Permisos/rols dins del JWT no es refresquen — ✅ Resolt (MR !41, rutes HTTP)
- **On:** `auth/strategies/jwt.strategy.ts`
- **Risc:** `validate()` retornava rols/permisos del payload del token sense rellegir la BD. Revocar un rol no tenia efecte fins que el token expirava (1 dia).
- ✅ **Fet:** `JwtStrategy.validate` carrega l'usuari de la BD i en deriva rols/permisos frescos a cada petició; rebutja tokens d'usuaris eliminats. Verificat en viu.
- ⏳ **Pendent (menor):** el gateway WebSocket encara usa els permisos del payload (mitigat per la revalidació de sessió d'A1/A2).

### [x] M2 · Token JWT a la query string (SSE i callback OAuth) — ✅ Resolt (MR !39, !42)
- **On:** `logger/logs.controller.ts`, `auth/auth.controller.ts`, `client/src/pages/AuthCallback.tsx`
- **Risc:** El token (i el `user` amb rols/permisos) viatjava per la URL → quedava a logs d'accés, proxies i historial del navegador.
- ✅ **Fet (SSE, MR !39):** el stream s'autoritza amb un tiquet d'un sol ús i vida curta (60s); el JWT ja no apareix a la URL del stream.
- ✅ **Fet (OAuth, MR !42):** el callback ja no posa `token`+`user` a la URL; redirigeix amb un codi opac d'un sol ús que el frontend bescanvia per `POST /auth/exchange`. Verificat (rebuig de codi invàlid).

### [x] M3 · `GET /system/stats` sense permís — ✅ Resolt (MR !31)
- **On:** `system/system.controller.ts:8`
- **Risc:** Només `JwtAuthGuard`; qualsevol usuari autenticat veu CPU/mem/disc/uptime del host.
- **Correcció:** Protegir amb un permís (p. ex. `read:logsystem` o un nou `read:system`).

### [x] M4 · Dades sensibles als logs, exposades via API — ✅ Resolt (MR !39)
- **On:** `logger/app-logger.service.ts`, `logger/logs.controller.ts`, `logger/log-redact.ts`
- **Risc:** Es persisteix cada log de Nest (incloent stack traces a `metadata`) i `GET /api/logs` ho retorna a qualsevol `read:logsystem`. Si algun servei registra cossos de petició, tokens o errors d'Odoo amb credencials, són recuperables. A més `limit` no tenia sostre màxim.
- ✅ **Fet:** redacció a l'escriptura (Bearer/JWT/`password`/`token`/`secret`/`api_key`/`odooPassword`… al missatge i a la metadata) i `limit` limitat a 500. Així queda net a la BD, a l'API i al stream.

### [x] M5 · Noms de fitxer d'upload amb `Math.random()` — ✅ Resolt (MR !38)
- **On:** `albums/albums.controller.ts:84-87`
- **Risc:** `Math.random()` no és criptogràfic i els uploads són públics a `/uploads/<nom>` → enumerables.
- **Correcció:** Usar `crypto.randomUUID()` o `crypto.randomBytes(16).toString('hex')`.

### [x] M6 · CORS reflecteix qualsevol origin amb credencials — ✅ Resolt (MR !31)
- **On:** `main.ts:38-42`
- **Risc:** `origin: true` + `credentials: true` reflecteix l'Origin del client.
- **Correcció:** Allowlist explícita basada en `CLIENT_URL`.

### [x] M7 · Estat de deploy marcat "success" abans d'executar-se — ✅ Resolt (MR !37)
- **On:** `deploy/deploy.controller.ts:161-164`
- **Risc:** L'historial de desplegaments no és fiable per a auditoria.
- **Correcció:** Marcar l'estat segons el resultat real del procés.

### [x] M8 · Sense protecció de "darrer admin" ni autoeliminació — ✅ Resolt (MR !38)
- **On:** `users/users.controller.ts`, `users/users.service.ts`
- **Risc:** Un titular de `manage:users` pot eliminar-se, eliminar l'últim admin, o atorgar-se el rol admin.
- ✅ **Fet:** es bloqueja eliminar el propi compte, eliminar l'últim admin i treure-li el rol admin.
- ⏳ **Pendent (menor):** restringir que un usuari s'autoatorgui el rol admin editant els seus propis `roleIds` (escalada de privilegis).

### [x] M9 · Títol automàtic de conversa sense sanititzar — ✅ Resolt (MR !38)
- **On:** `chat/chat.gateway.ts`
- **Risc:** El títol es derivava del primer missatge (atacant-controlat) i s'emetia a la sala. Risc baix perquè el frontend escapa el text en renderitzar (no hi ha `dangerouslySetInnerHTML`).
- ✅ **Fet:** `sanitizeTitle()` treu chars de control i `< >`, col·lapsa espais i limita a 60.

---

## 🟢 Baixos / deute tècnic / rendiment

### [ ] B1 · `synchronize: true` en producció
- **On:** `app.module.ts:53`. Risc de pèrdua de dades en canvis d'esquema. → Adoptar migracions TypeORM.

### [x] B2 · Swagger exposat públicament en producció — ✅ Resolt (MR !31)
- **On:** `main.ts:46-53`. → Desactivar `/api/docs` quan `NODE_ENV=production` o protegir-lo.

### [ ] B3 · bcrypt amb cost 10
- **On:** `users/users.service.ts:22,84,108`. → Pujar a 12 i fer-ho configurable.

### [ ] B4 · Càrregues LLM ineficients (cost de tokens i latència)
- **On:** `chat-orchestrator.service.ts:405-413` (carrega 200 àlbums i els passa sencers a l'LLM), `odoo/odoo-client.service.ts:315-336` (`getMostSoldProduct` baixa 200 línies i agrega en JS). → Filtrar per intenció i limitar a N petit; usar `read_group` d'Odoo.

### [ ] B5 · Gestió del socket del xat al frontend
- **On:** `client/src/pages/GlobalChat.tsx:246-374`. Singleton mai desconnectat, re-subscripció dels handlers a cada canvi de conversa, token capturat de forma stale. → Gestionar el socket dins un `useEffect` amb cleanup i recrear-lo en canvi de token.

### [ ] B6 · Codi duplicat
- **On:** `client/src/pages/AlbumForm.tsx` ↔ `PhotoForm.tsx`; `GlobalChat.tsx` `BarChartBlock` ↔ `LineChartBlock`. → Extreure hooks/components compartits.

### [ ] B7 · Restes de depuració i tipatge feble
- **On:** `client/src/context/AuthContext.tsx:11`, `client/src/main.tsx`. `console.log` deixats; ús abundant de `any`; `key={i}` en taules. → Netejar i tipar.

### [ ] B8 · `uploads/` versionat a git
- **On:** repo arrel (`uploads/`, 16 fitxers). → Treure del control de versions (`.gitignore`) i servir des d'emmagatzematge persistent.

### [ ] B9 · Sense guard JWT global
- **On:** guards aplicats manualment per controlador. Un controlador nou que oblidi `@UseGuards` queda obert. → Registrar `JwtAuthGuard`+`RolesGuard` com a `APP_GUARD` amb opt-out `@Public()`.

---

## Pla d'acció recomanat (ordre)

1. **C1** — Treure el socket de Docker i moure el deploy fora de l'app web.
2. **C2** — Eliminar credencials de seed per defecte en producció.
3. **C3 + C4** — Permís d'escriptura Odoo separat + validació zod de la sortida LLM.
4. **A1 + A2** — Autenticar i revalidar sessions al WebSocket; fallar en tancat.
5. **A3** — `helmet` + `@nestjs/throttler`; tancar CORS (M6).
6. **A4 + A5** — Xifrar contrasenyes d'Odoo; JWT a cookie `HttpOnly` + sanititzar markdown.
7. **Mitjà termini** — Migracions TypeORM (B1), refrescar permisos des de BD (M1), tancar Swagger (B2).

---

## Notes

- El "master-admin bypass per username/email hardcoded" descrit en versions anteriors del CLAUDE.md **ja no existeix**: `auth/is-master-admin.ts` comprova el rol `admin` real de la BD (`user.roles.includes('admin')`). CLAUDE.md actualitzat en aquesta revisió.
- Punts ja correctes: el secret JWT es llegeix amb `getOrThrow('JWT_SECRET')` sense fallback; les contrasenyes d'usuari es guarden amb bcrypt i `select: false`; els tokens de sessió s'emmagatzemen com a hash sha256; `ValidationPipe` amb `whitelist: true` està actiu; el `rollback` del deploy valida el hash amb regex i usa `execFileSync` (sense shell).
