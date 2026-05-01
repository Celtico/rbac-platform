# Plataforma de Gestió Empresarial

Aplicació web full-stack de gestió empresarial amb RBAC, chat intel·ligent, seguretat de sessions i monitorització en temps real.

**Stack:** NestJS · React 19 · TypeScript · SQLite · LangChain/OpenAI · Socket.io · Chakra UI

---

## Característiques principals

### Chat Global Intel·ligent
- Converses persistents per usuari (historial a la base de dades)
- Orquestrador LangChain que enruta a tots els serveis de l'API:
  - **Odoo ERP** (vendes, clients, productes, factures, RRHH…) — requereix `use:ai`
  - **Galeria de fotos** — requereix `read:photos`
  - **Gestió d'usuaris** — requereix `read:users`
  - **Estadístiques del sistema** — requereix rol `admin`
  - **General** — ajuda i navegació (sense permís)
- Si l'usuari no té permís, l'assistent explica quins permisos necessita
- Comunicació en temps real via WebSocket (Socket.io, namespace `/chat`)
- Respostes sempre en català

### Seguretat de Sessions
- Rastrejament de dispositius: browser, sistema operatiu, IP, fingerprint
- Advertència en primera connexió des d'un dispositiu nou
- Avís si el compte ja té una sessió activa en un altre dispositiu
- Gestor de dispositius connectats (revocar sessions individuals o totes les altres)
- Middleware de validació que invalida JWTs revocats immediatament

### Sistema de Logs Centralitzat (estil Cockpit)
- Tots els logs del servidor NestJS es desen a la base de dades
- Streaming en temps real via SSE (`/api/logs/stream`)
- Visor amb filtres per nivell, context i cerca de text
- Requereix permís `read:logsystem`

### Control d'Accés Basat en Rols (RBAC)
- Usuaris → Rols → Permisos (relació many-to-many)
- Guards per rols i permisos en tots els endpoints
- Suport OAuth2 Google
- JWT amb expiració d'1 dia

### Multi-tenant Odoo
- Cada usuari pot tenir un tenant Odoo assignat
- Fallback al tenant "Default" si no n'hi ha cap d'assignat

---

## Permisos del sistema

| Permís | Descripció |
|--------|-----------|
| `read:photos` | Veure galeria de fotos |
| `write:photos` | Pujar i editar fotos |
| `read:users` | Veure llista d'usuaris |
| `manage:users` | Crear/editar/eliminar usuaris |
| `read:roles` | Veure rols i permisos |
| `manage:roles` | Crear/editar rols |
| `use:ai` | Accés a Odoo AI |
| `use:chat` | Accés al Chat Global |
| `read:tenants` | Veure configuració tenants |
| `manage:tenants` | Gestionar tenants Odoo |
| `manage:deploy` | Historial i rollback de desplegaments |
| `read:logsystem` | Veure logs del servidor en temps real |

---

## Desplegament

### Opció 1: Docker (Recomanat)

```bash
docker compose up -d --build
```

L'aplicació estarà disponible a `http://localhost:3000`.  
Les dades es desen a `./data` (SQLite) i `./uploads` (fitxers).

### Opció 2: Manual

```bash
# Frontend
cd client && npm install && npm run build

# Backend
cd ../server && npm install && npm run build && npm run start:prod
```

---

## Desenvolupament local

```bash
# Backend (port 3000)
cd server && npm run start:dev

# Frontend (port 5173, amb proxy al backend)
cd client && npm run dev
```

### Variables d'entorn (`server/.env.local`)

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini        # opcional

# OAuth Google (opcional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
CLIENT_URL=http://localhost:5173

# Odoo (opcional, crea tenant "Default")
ODOO_URL=https://demo.odoo.com
ODOO_DB=odoo_demo
ODOO_USER=admin
ODOO_PASSWORD=admin
```

---

## API

Documentació Swagger disponible a `/api/docs` (requereix autenticació Bearer).

### Endpoints principals

| Mètode | Ruta | Descripció |
|--------|------|-----------|
| `POST` | `/api/auth/login` | Login amb usuari/contrasenya |
| `GET` | `/api/auth/google` | Inici OAuth Google |
| `GET/POST/DELETE` | `/api/chat/conversations` | Converses del chat |
| `WS` | `/chat` (namespace) | Chat en temps real |
| `GET/DELETE` | `/api/sessions` | Gestió de sessions/dispositius |
| `GET` | `/api/logs` | Historial de logs |
| `GET` | `/api/logs/stream?token=` | Logs en temps real (SSE) |
| `GET` | `/api/system/stats` | Estadístiques del servidor |
| `POST` | `/api/odoo/chat` | Chat Odoo directe |

---

## Usuaris per defecte (seed)

| Usuari | Contrasenya | Rol |
|--------|-------------|-----|
| `admin` | `adminpassword` | admin (tots els permisos) |
| `celticopetit@gmail.com` | `celticopetit@gmail.com` | admin |
| `user` | `userpassword` | user (fotos + chat) |

---

## Estructura del projecte

```
├── client/                 # React 19 + Vite + Chakra UI
│   └── src/
│       ├── pages/          # GlobalChat, SystemLogs, DeviceManager, OdooChat…
│       ├── components/     # Layout, SidebarNav, modals de seguretat
│       ├── context/        # AuthContext, ThemeContext, NavConfigContext
│       └── api/            # Client axios + tipus TypeScript
│
└── server/                 # NestJS
    └── src/
        ├── auth/           # JWT, Google OAuth, guards, decoradors
        ├── chat/           # Chat global + gateway WS + orquestrador LangChain
        ├── sessions/       # Rastrejament de dispositius + middleware
        ├── logger/         # Logs centralitzats + SSE
        ├── odoo/           # Client Odoo JSON-RPC + orquestrador
        ├── users/          # Gestió d'usuaris
        ├── roles/          # Gestió de rols
        ├── permissions/    # Gestió de permisos
        ├── tenants/        # Configuració multi-tenant
        ├── albums/         # Galeria de fotos
        ├── system/         # Estadístiques del servidor
        └── common/         # Seed, guards compartits
```

---

## Personalització de la interfície

Des de `/admin/settings/styles`:
- 4 temes de colors (Default, Ocean, Forest, Sunset)
- 6 nivells de cantons arrodonits
- Mode dia/nit
