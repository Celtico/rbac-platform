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

# --- Opcional ---
OPENAI_MODEL=gpt-4o-mini                 # model per defecte

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

Per generar un `JWT_SECRET` segur:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> ⚠️ **Seguretat:** `JWT_SECRET` és obligatori i no té cap valor per defecte; un secret feble o conegut permetria forjar tokens d'administrador. No el comparteixis mai ni el pugis a git.

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
│       ├── main.ts              # Bootstrap: prefix /api, Swagger, WS, logger
│       ├── app.module.ts        # Mòdul arrel, TypeORM, ServeStatic, middleware
│       ├── auth/                # JWT, Google OAuth, guards i decoradors RBAC
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
├── uploads/                     # Fitxers pujats (servits a /uploads)
├── data/                        # Base de dades SQLite (db.sqlite)
├── Dockerfile                   # Imatge de l'aplicació
├── docker-compose.yaml          # Orquestració de contenidors
└── deploy.sh                    # Script de desplegament auto-reconstruïble
```

---

## Punts principals del codi

Per entendre l'arquitectura ràpidament, aquests són els fitxers clau:

- **`server/src/main.ts`** — Bootstrap. Munta tot sota el prefix `/api`, activa Swagger a `/api/docs`, l'adaptador WebSocket de Socket.io i el logger personalitzat (`AppLoggerService`).

- **`server/src/app.module.ts`** — Configuració de TypeORM (SQLite a `data/db.sqlite`), servei estàtic de `/uploads` i del client compilat, i registre del `SessionValidationMiddleware` a totes les rutes.

- **`server/src/chat/chat-orchestrator.service.ts`** — El cervell del chat. Patró de dues capes: un **router LLM** classifica el missatge en un domini, es comprova el permís, es carreguen **dades reals** del servei corresponent i un prompt **"analyst"** redacta la resposta en català (amb gràfiques `:::chart` quan hi ha números). Els dominis Odoo deleguen a l'orquestrador d'Odoo.

- **`server/src/odoo/odoo-orchestrator.service.ts`** i **`odoo-client.service.ts`** — Segon router específic d'Odoo (vendes, clients, stock, factures…) i el client JSON-RPC que parla amb l'ERP.

- **`server/src/auth/`** — Tota l'autenticació i autorització:
  - `guards/roles.guard.ts` — Aplica `@Roles(...)` (OR) i `@Permissions(...)` (AND).
  - `is-master-admin.ts` — Comprovació centralitzada de superadmin, basada en el **rol `admin` real de la BD**.
  - `jwt.config.ts` — Configuració compartida del JWT; llegeix `JWT_SECRET` de l'entorn (obligatori).
  - `decorators/roles.decorator.ts` — Decoradors `@Public()`, `@Roles()`, `@Permissions()`.

- **`server/src/sessions/sessions.middleware.ts`** — A cada petició, fa hash del token bearer i invalida la sessió si ha estat revocada (revocació de dispositius en temps real).

- **`server/src/logger/app-logger.service.ts`** — Logger global que persisteix cada log a la BD i el publica als subscriptors SSE.

- **`client/src/api/index.ts`** — Instància única d'axios amb interceptors: injecta el token bearer i, davant d'un `401`, neteja la sessió i redirigeix a `/login`. Totes les crides a l'API tipades hi viuen.

- **`client/src/context/`** — Estat global: `AuthContext` (usuari/token), `ThemeContext` (4 temes, mode dia/nit, cantons arrodonits) i `NavConfigContext`.

---

## API i endpoints

Documentació Swagger interactiva a **`/api/docs`** (requereix autenticació Bearer).

| Mètode | Ruta | Descripció |
|--------|------|-----------|
| `POST` | `/api/auth/login` | Login amb usuari/contrasenya |
| `GET` | `/api/auth/google` | Inici del flux OAuth Google |
| `GET/POST/DELETE` | `/api/chat/conversations` | Converses del chat |
| `WS` | `/chat` (namespace) | Chat en temps real (Socket.io) |
| `GET/DELETE` | `/api/sessions` | Gestió de sessions/dispositius |
| `GET` | `/api/logs` | Historial de logs |
| `GET` | `/api/logs/stream?token=` | Logs en temps real (SSE) |
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
| `use:ai` | Accés a Odoo AI |
| `use:chat` | Accés al Chat Global |
| `read:tenants` / `manage:tenants` | Veure / gestionar tenants Odoo |
| `manage:deploy` | Historial i rollback de desplegaments |
| `read:logsystem` | Veure logs del servidor en temps real |

### Usuaris per defecte (seed)

Es creen automàticament a la primera arrencada:

| Usuari | Contrasenya | Rol |
|--------|-------------|-----|
| `admin` | `adminpassword` | admin (tots els permisos) |
| `celticopetit@gmail.com` | `celticopetit@gmail.com` | admin |
| `user` | `userpassword` | user (fotos + chat) |

> ⚠️ **Canvia aquestes contrasenyes abans de qualsevol desplegament real.** Són només per a desenvolupament.

---

## Desplegament

### Docker (recomanat)

```bash
docker compose up -d --build
```

L'aplicació queda disponible a `http://localhost:3000`. Les dades persisteixen a `./data` (SQLite) i `./uploads` (fitxers). Recorda definir `JWT_SECRET` i `OPENAI_API_KEY` a l'entorn del contenidor.

### Script de desplegament

`deploy.sh` és un script auto-reconstruïble per al servidor de producció: actualitza des de git i reconstrueix els contenidors Docker. L'historial es desa a `deploy-history.json` i és accessible amb el permís `manage:deploy`.

---

## Personalització de la interfície

Des de `/admin/settings/styles`: 4 temes de colors (Default, Ocean, Forest, Sunset), 6 nivells de cantons arrodonits i mode dia/nit.
