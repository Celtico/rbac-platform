# Plataforma de Gestió Empresarial

Aplicació web full-stack de gestió empresarial amb control d'accés per rols (RBAC), chat intel·ligent amb IA, integració ERP Odoo, seguretat de sessions i monitorització en temps real.

**Stack:** NestJS · React 19 · TypeScript · SQLite (TypeORM) · LangChain/OpenAI · Socket.io · Chakra UI · Vite

---

## Taula de continguts

- [Descripció](#descripció)
- [Característiques principals](#característiques-principals)
- [Requisits previs](#requisits-previs)
- [Instal·lació](#installació)
- [Configuració (variables d'entorn)](#configuració-variables-dentorn)
- [Execució](#execució)
- [Estructura de carpetes](#estructura-de-carpetes)
- [Punts principals del codi](#punts-principals-del-codi)
- [API i endpoints](#api-i-endpoints)
- [Permisos i usuaris per defecte](#permisos-i-usuaris-per-defecte)
- [Desplegament](#desplegament)

---

## Descripció

És una plataforma de gestió que unifica diversos serveis darrere d'un sol backend NestJS i un frontend React. El cor de l'aplicació és un **orquestrador de chat amb IA** que entén llenguatge natural (en català) i enruta cada petició al servei adequat —ERP Odoo, galeria de fotos, gestió d'usuaris o estadístiques del sistema— comprovant sempre els permisos de l'usuari.

En producció, el servidor NestJS serveix tant l'API (sota `/api`) com el frontend React ja compilat, de manera que tot funciona en un únic origen i un sol contenidor.

---

## Característiques principals

### Chat Global Intel·ligent
- Converses persistents per usuari (historial a la base de dades).
- Orquestrador LangChain que classifica el missatge i l'enruta a tots els serveis de l'API:
  - **Odoo ERP** (vendes, clients, productes, factures, RRHH…) — requereix `use:ai`
  - **Galeria de fotos** — requereix `read:photos` (lectura) / `write:photos` (creació)
  - **Gestió d'usuaris** — requereix `read:users`
  - **Estadístiques del sistema** — requereix el rol `admin`
  - **General** — ajuda i navegació (sense permís)
- Si l'usuari no té permís, l'assistent explica quin permís necessita.
- Comunicació en temps real via WebSocket (Socket.io, namespace `/chat`).
- Genera gràfiques inline (blocs `:::chart`) a partir de dades numèriques. Respostes sempre en català.

### Seguretat de Sessions
- Rastrejament de dispositius: navegador, sistema operatiu, IP, fingerprint.
- Advertència en la primera connexió des d'un dispositiu nou i avís de sessió concurrent.
- Gestor de dispositius connectats (revocar sessions individuals o totes les altres).
- Middleware que invalida immediatament els JWT de sessions revocades.

### Sistema de Logs Centralitzat
- Tots els logs del servidor NestJS es persisteixen a la base de dades.
- Streaming en temps real via SSE (`/api/logs/stream`).
- Visor amb filtres per nivell, context i cerca de text (requereix `read:logsystem`).

### Control d'Accés Basat en Rols (RBAC)
- Model Usuaris → Rols → Permisos (many-to-many).
- Guards de rols i permisos a tots els endpoints. Autenticació JWT (caducitat 1 dia) + OAuth2 Google.

### Integració Odoo multi-tenant
- Cada usuari pot tenir un tenant Odoo assignat (amb fallback al tenant "Default").
- Lectura de dades i creació de registres reals (p. ex. factures) des del chat, via JSON-RPC.

---

## Requisits previs

- **Node.js** ≥ 18 i **npm**.
- Una **clau d'API d'OpenAI** (per al chat amb IA).
- Opcional: **Docker** i **Docker Compose** (desplegament en contenidor).
- Opcional: una instància **Odoo** accessible (per a les funcions d'ERP).

---

## Instal·lació

```bash
git clone <url-del-repositori>
cd untitled3

# Dependències del backend
cd server && npm install

# Dependències del frontend
cd ../client && npm install
```

---

## Configuració (variables d'entorn)

Crea el fitxer `server/.env.local` (ignorat per git). Variables disponibles:

```env
# --- Obligatori ---
JWT_SECRET=<cadena_llarga_i_aleatòria>   # sense això, el servidor NO arrenca
OPENAI_API_KEY=sk-...

# --- Seguretat / producció ---
# Contrasenyes dels comptes sembrats. Només es consulten quan el compte no
# existeix (BD buida). En producció, si en falta alguna, l'arrencada AVORTA.
SEED_ADMIN_PASSWORD=<forta>
SEED_USER_PASSWORD=<forta>
SEED_SUPERADMIN_PASSWORD=<forta>
# Clau per xifrar en repòs les contrasenyes d'Odoo dels tenants (AES-256-GCM).
# Si no es defineix, es deriva del JWT_SECRET (no canviïs el JWT_SECRET després).
TENANT_ENCRYPTION_KEY=<forta_i_estable>
# Orígens permesos pel CORS (separats per comes). Si no, s'usa CLIENT_URL.
CORS_ORIGINS=https://album.serverscel.com

# --- Opcional ---
OPENAI_MODEL=gpt-4o-mini                 # model per defecte
DB_SYNCHRONIZE=false                     # en dev és true per defecte; mai a prod
SWAGGER_ENABLED=false                    # exposa /api/docs en prod si és true

# OAuth Google (opcional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
CLIENT_URL=http://localhost:5173

# Odoo (opcional, crea el tenant "Default")
ODOO_URL=https://demo.odoo.com
ODOO_DB=odoo_demo
ODOO_USER=admin
ODOO_PASSWORD=admin
```

#### Odoo simulat (sense instància d'Odoo)

Si no tens cap Odoo a mà, posa `simulated` com a URL i el backend fa d'Odoo ell mateix:

```env
ODOO_URL=simulated
ODOO_DB=demo
ODOO_USER=demo
ODOO_PASSWORD=demo
```

- Les dades (una fusteria fictícia: clients, productes, comandes, factures, compres, CRM, empleats i projectes) se sembren a la taula `odoo_sim_records` del mateix SQLite la primera vegada que la taula és buida.
- Tot el que hi ha per sobre del client d'Odoo funciona igual: panell, gestor d'Odoo, xat amb IA i **creació de factures** (queden desades i numerades `FAC/AAAA/NNNNN`).
- `ODOO_URL` només s'aplica quan es crea el tenant "Default" (BD buida). En una instal·lació existent, edita el tenant a **Admin → Tenants** i posa-hi `simulated` com a URL d'Odoo.
- És una demo, no un ERP: no hi ha comptabilitat darrere de les factures. El codi és a `server/src/odoo/simulated/`.

Per generar secrets segurs (`JWT_SECRET`, `TENANT_ENCRYPTION_KEY`):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> ⚠️ **Seguretat:** `JWT_SECRET` és obligatori i no té cap valor per defecte; un secret feble o conegut permetria forjar tokens d'administrador. No comparteixis ni pugis a git cap d'aquests secrets.

El frontend pot tenir un `client/.env.local` amb claus `VITE_*` (p. ex. `VITE_UNSPLASH_ACCESS_KEY`). Recorda que **qualsevol variable `VITE_` queda inclosa al bundle del client** i és pública.

---

## Execució

### Desenvolupament local

```bash
# Terminal 1 — Backend (port 3000), amb recàrrega automàtica
cd server && npm run start:dev

# Terminal 2 — Frontend (port 5173), amb proxy de /api cap al backend
cd client && npm run dev
```

Obre `http://localhost:5173`.

### Producció (manual)

```bash
# Compila el frontend
cd client && npm run build

# Compila i arrenca el backend (serveix també el client compilat)
cd ../server && npm run build && npm run start:prod
```

L'aplicació queda disponible a `http://localhost:3000`.

### Scripts útils

**Backend** (`server/`):

| Script | Descripció |
|--------|-----------|
| `npm run start:dev` | Arrenca en mode watch |
| `npm run start:prod` | Arrenca des de `dist/` (cal `build` previ) |
| `npm run build` | Compila amb `nest build` |
| `npm run lint` | ESLint amb `--fix` |
| `npm test` | Tests unitaris (Jest) |
| `npm run test:e2e` | Tests end-to-end |
| `npm run migration:generate src/migrations/<Nom>` | Genera una migració TypeORM |
| `npm run migration:run` / `migration:revert` | Aplica / reverteix migracions |

**Frontend** (`client/`):

| Script | Descripció |
|--------|-----------|
| `npm run dev` | Servidor de desenvolupament Vite |
| `npm run build` | `tsc -b && vite build` |
| `npm run lint` | ESLint |
| `npm run cypress` | Obre el runner de Cypress |

---

## Estructura de carpetes

```
untitled3/
├── server/                      # Backend NestJS
│   └── src/
│       ├── main.ts              # Bootstrap: prefix /api, helmet, CORS, Swagger, WS, logger
│       ├── app.module.ts        # Mòdul arrel, TypeORM (migracions), guards globals, middleware
│       ├── data-source.ts       # DataSource per a la CLI de migracions TypeORM
│       ├── migrations/          # Migracions de l'esquema (InitialSchema…)
│       ├── auth/                # JWT (header o cookie), Google OAuth, guards i decoradors RBAC
│       ├── chat/                # Chat global: gateway WS + orquestrador LangChain
│       ├── odoo/                # Client Odoo (JSON-RPC) + orquestrador ERP
│       ├── openai/              # Accés directe a l'SDK d'OpenAI
│       ├── sessions/            # Rastrejament de dispositius + middleware de validació
│       ├── logger/              # Logs centralitzats a BD + streaming SSE
│       ├── albums/              # Galeria de fotos i pujada de fitxers
│       ├── users/               # Gestió d'usuaris
│       ├── roles/               # Gestió de rols
│       ├── permissions/         # Gestió de permisos
│       ├── tenants/             # Configuració multi-tenant Odoo
│       ├── system/              # Estadístiques del servidor (CPU, memòria, disc)
│       ├── deploy/              # Historial i rollback de desplegaments
│       └── common/              # Seed de dades inicials
│
├── client/                      # Frontend React 19 + Vite
│   └── src/
│       ├── App.tsx              # Definició de rutes
│       ├── api/                 # Client axios + tipus TypeScript
│       ├── pages/               # Una pàgina per ruta (GlobalChat, SystemLogs…)
│       ├── components/          # Layout, navegació, modals, gràfiques
│       ├── context/             # AuthContext, ThemeContext, NavConfigContext
│       └── lib/                 # Utilitats
│
├── odoo/                        # Instància Odoo vendoritzada (docker-compose propi)
├── uploads/                     # Fitxers pujats (servits a /uploads; fora de git)
├── data/                        # Base de dades SQLite (db.sqlite)
├── Dockerfile                   # Imatge de l'aplicació
├── docker-compose.yaml          # Orquestració de contenidors (sense socket Docker)
├── deploy.sh                    # Build + reinici (només host)
├── deploy-watcher.sh            # Watcher de desplegament al host (systemd/cron)
├── DEPLOY.md                    # Model de desplegament i migracions
└── SECURITY.md                  # Informe de seguretat i estat de les correccions
```

---

## Punts principals del codi

Per entendre l'arquitectura ràpidament, aquests són els fitxers clau:

- **`server/src/main.ts`** — Bootstrap. Munta tot sota el prefix `/api`, activa Swagger a `/api/docs`, l'adaptador WebSocket de Socket.io i el logger personalitzat (`AppLoggerService`).

- **`server/src/app.module.ts`** — Configuració de TypeORM (SQLite a `data/db.sqlite`, esquema per **migracions**; `synchronize` desactivat en producció), servei estàtic de `/uploads` i del client compilat, guards globals (`ThrottlerGuard` + `JwtAuthGuard` + `RolesGuard`, amb opt-out `@Public()`) i registre del `SessionValidationMiddleware` a totes les rutes.

- **`server/src/chat/chat-orchestrator.service.ts`** — El cervell del chat. Patró de dues capes: un **router LLM** classifica el missatge en un domini, es comprova el permís, es carreguen **dades reals** del servei corresponent i un prompt **"analyst"** redacta la resposta en català (amb gràfiques `:::chart` quan hi ha números). Els dominis Odoo deleguen a l'orquestrador d'Odoo.

- **`server/src/odoo/odoo-orchestrator.service.ts`** i **`odoo-client.service.ts`** — Segon router específic d'Odoo (vendes, clients, stock, factures…) i el client JSON-RPC que parla amb l'ERP.

- **`server/src/auth/`** — Tota l'autenticació i autorització:
  - `guards/roles.guard.ts` — Aplica `@Roles(...)` (OR) i `@Permissions(...)` (AND).
  - `is-master-admin.ts` — Comprovació centralitzada de superadmin, basada en el **rol `admin` real de la BD**.
  - `jwt.config.ts` — Configuració compartida del JWT; llegeix `JWT_SECRET` de l'entorn (obligatori).
  - `decorators/roles.decorator.ts` — Decoradors `@Public()`, `@Roles()`, `@Permissions()`.

- **`server/src/sessions/sessions.middleware.ts`** — A cada petició, agafa el token (capçalera Bearer o cookie), en fa hash i rebutja la petició si la sessió no existeix o ha estat revocada (revocació de dispositius en temps real, *fail-closed*).

- **`server/src/logger/app-logger.service.ts`** — Logger global que persisteix cada log a la BD i el publica als subscriptors SSE.

- **`client/src/api/index.ts`** — Instància única d'axios (`withCredentials`, per enviar la cookie d'auth) amb interceptors: injecta el token bearer i, davant d'un `401`, neteja la sessió i redirigeix a `/login`. Totes les crides a l'API tipades hi viuen.

- **`client/src/context/`** — Estat global: `AuthContext` (usuari/token), `ThemeContext` (4 temes, mode dia/nit, cantons arrodonits) i `NavConfigContext`.

---

## API i endpoints

Documentació Swagger interactiva a **`/api/docs`** (requereix autenticació Bearer).

| Mètode | Ruta | Descripció |
|--------|------|-----------|
| `POST` | `/api/auth/login` | Login amb usuari/contrasenya (posa cookie HttpOnly + retorna token) |
| `POST` | `/api/auth/logout` | Tanca la sessió (neteja la cookie) |
| `GET` | `/api/auth/google` | Inici del flux OAuth Google (retorna un codi d'un sol ús) |
| `POST` | `/api/auth/exchange` | Bescanvia el codi OAuth per token + usuari |
| `GET/POST/DELETE` | `/api/chat/conversations` | Converses del chat |
| `WS` | `/chat` (namespace) | Chat en temps real (Socket.io; revalida la sessió) |
| `GET/DELETE` | `/api/sessions` | Gestió de sessions/dispositius |
| `GET` | `/api/logs` | Historial de logs (secrets redactats) |
| `GET` | `/api/logs/stream-ticket` | Obté un tiquet d'un sol ús per a l'SSE |
| `GET` | `/api/logs/stream?ticket=` | Logs en temps real (SSE, autoritzat per tiquet) |
| `GET` | `/api/system/stats` | Estadístiques del servidor |
| `GET/POST` | `/api/photos` | Galeria de fotos |
| `POST` | `/api/photos/upload` | Pujada d'imatges (només imatges, màx. 10 MB) |

---

## Permisos i usuaris per defecte

### Permisos del sistema

| Permís | Descripció |
|--------|-----------|
| `read:photos` / `write:photos` | Veure / pujar i editar fotos |
| `read:users` / `manage:users` | Veure / gestionar usuaris |
| `read:roles` / `manage:roles` | Veure / gestionar rols |
| `use:ai` | Lectura d'Odoo via IA |
| `write:odoo` | Accions d'escriptura a Odoo (p. ex. crear factures) |
| `use:chat` | Accés al Chat Global |
| `read:tenants` / `manage:tenants` | Veure / gestionar tenants Odoo |
| `manage:deploy` | Historial i rollback de desplegaments |
| `read:logsystem` | Veure logs del servidor en temps real |

### Usuaris per defecte (seed)

Es creen només si no existeixen (BD buida). Les contrasenyes vénen de les
variables `SEED_*`; **en producció, si en falta alguna, l'arrencada avorta** (no
es creen mai comptes amb contrasenya feble). Els valors de sota són només els
**defaults de desenvolupament** (quan no hi ha `SEED_*`):

| Usuari | Origen contrasenya | Default (només dev) | Rol |
|--------|--------------------|---------------------|-----|
| `admin` | `SEED_ADMIN_PASSWORD` | `adminpassword` | admin (tots els permisos) |
| `celticopetit@gmail.com` | `SEED_SUPERADMIN_PASSWORD` | `celticopetit@gmail.com` | admin |
| `user` | `SEED_USER_PASSWORD` | `userpassword` | user (fotos + chat) |

> ⚠️ **En producció defineix sempre les `SEED_*` amb contrasenyes fortes.** Els defaults de dev no s'han d'usar mai en un desplegament real.

---

## Desplegament

### Docker (recomanat)

```bash
docker compose up -d --build
```

L'aplicació queda disponible a `http://localhost:3000`. Les dades persisteixen a `./data` (SQLite) i `./uploads` (fitxers). Recorda definir les variables d'entorn de producció (`JWT_SECRET`, `OPENAI_API_KEY`, `SEED_*`, `TENANT_ENCRYPTION_KEY`, `CORS_ORIGINS`).

> ⚠️ El contenidor **no** munta el socket de Docker (seria root al host). Vegeu el model complet a **[`DEPLOY.md`](./DEPLOY.md)**.

### Desplegament i migracions

El desplegament des de la UI (`manage:deploy`) **no executa Docker**: només escriu una sol·licitud que un **watcher al host** (`deploy-watcher.sh`, via systemd/cron) processa, desplegant des de git origin. L'esquema de BD el gestionen **migracions** (`synchronize` desactivat en producció).

Passos i detalls (instal·lació del watcher, **baseline d'un sol cop** de la BD existent abans del primer deploy amb migracions): vegeu **[`DEPLOY.md`](./DEPLOY.md)**. L'historial de desplegaments es desa a `data/deploy-history.json` (permís `manage:deploy`).

---

## Personalització de la interfície

Des de `/admin/settings/styles`: 4 temes de colors (Default, Ocean, Forest, Sunset), 6 nivells de cantons arrodonits i mode dia/nit.
