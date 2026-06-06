# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Full-stack business-management platform (internally "album-manager"): **NestJS** backend + **React 19/Vite** frontend, SQLite via TypeORM, LangChain/OpenAI chat, Socket.io, Chakra UI. The repo also vendors a standalone **Odoo** instance (`odoo/`) used as the ERP data source. UI text and assistant responses are in **Catalan**.

## Commands

```bash
# Backend (server/) — runs on port 3000, serves /api and the built client
cd server
npm run start:dev          # watch mode (dev)
npm run start:prod         # node dist/main (after npm run build)
npm run lint               # eslint --fix
npm test                   # jest (unit)
npm test -- auth-google    # run a single spec by name pattern
npm run test:e2e           # jest with test/jest-e2e.json

# Frontend (client/) — Vite dev server on port 5173, proxies /api → :3000
cd client
npm run dev
npm run build              # tsc -b && vite build
npm run lint               # eslint .
npm run cypress            # open Cypress e2e runner

# Full stack via Docker (single container serves API + client on :3000)
docker compose up -d --build
```

In dev, run the backend (`start:dev`) and frontend (`dev`) separately. In production the NestJS server serves the built `client/dist` statically, so everything is one origin on port 3000.

## Architecture

### Single-server model
`server/src/main.ts` mounts everything under the `/api` global prefix, attaches Swagger at `/api/docs`, enables the Socket.io WebSocket adapter, and uses a **custom logger** (`AppLoggerService`) so all Nest logs persist to the DB. `app.module.ts` also serves `/uploads` and `client/dist` via `ServeStaticModule`. TypeORM schema is managed by **migrations** (`server/src/migrations/`, datasource at `server/src/data-source.ts`): in production `synchronize` is off and pending migrations run on boot (`migrationsRun`); in dev `synchronize` stays on for convenience (`DB_SYNCHRONIZE=false` to opt out). See `DEPLOY.md` for the one-time baseline of the existing synchronize-created DB.

### Module layout (`server/src/`)
Standard Nest modules: `auth`, `users`, `roles`, `permissions`, `albums` (photo gallery), `tenants`, `odoo`, `openai`, `system` (server stats), `chat`, `sessions`, `logger`, `deploy`. `common/seed.service.ts` seeds default users, roles, and permissions on boot.

### Auth & RBAC
- JWT (1-day expiry) + Google OAuth2; strategies/guards in `auth/`.
- `@Public()`, `@Roles(...)`, `@Permissions(...)` decorators (`auth/decorators/roles.decorator.ts`) drive `RolesGuard`. `@Roles` is OR-matched; `@Permissions` is AND-matched (all required).
- **Master-admin bypass**: holders of the real `admin` **role** (from the DB, not a hardcoded username) skip all role/permission checks. The check lives in `auth/is-master-admin.ts` (`isMasterAdmin` = `user.roles.includes('admin')`) and is used by both `RolesGuard` and the chat orchestrator. Keep this in mind when reasoning about access — anyone with the `admin` role always passes.
- `SessionValidationMiddleware` runs on every route: it hashes the bearer token (sha256), looks up the `UserSession`, and throws `401` if the session is revoked — this is how device revocation invalidates a still-valid JWT immediately.

### Two-layer LLM orchestration
Both orchestrators use the same pattern: an LLM **router** classifies the message into a domain/intent (returns JSON `{domain, confidence}`), the handler fetches **real data** from a service, then an **analyst** prompt formats the answer — always in Catalan, and emits inline `:::chart … :::` blocks for numeric data that the frontend renders.

- `chat/chat-orchestrator.service.ts` — the **global** router. Routes to domains `odoo_read | odoo_action | photos | photos_action | users | system | general`, enforces per-domain permissions (`DOMAIN_PERMISSIONS`), and on permission failure returns a Catalan explanation of the missing permission instead of erroring. `odoo_*` domains delegate down to the Odoo orchestrator/client.
- `odoo/odoo-orchestrator.service.ts` — the **Odoo-specific** router (sales, customers, products, crm, stock, invoices, purchases, employees, projects, kpis). `odoo-client.service.ts` talks to Odoo over JSON-RPC.

When adding a chat capability, add it as a new domain handler in the global orchestrator and wire its permission into `DOMAIN_PERMISSIONS`; don't bypass the orchestrator.

### Multi-tenant Odoo
Each user may have an assigned `Tenant` (Odoo connection config); `TenantGuard` resolves it onto the request and `@OdooTenantConfig()` injects it into handlers. Falls back to the "Default" tenant seeded from `ODOO_*` env vars.

### Realtime channels
- **Chat**: Socket.io namespace `/chat` (`chat/chat.gateway.ts`). Events: `chat:send`, `chat:join`, `chat:message`, `chat:typing`, `chat:error`, `chat:title_updated`. Conversations/messages persist in the DB.
- **Logs**: SSE at `GET /api/logs/stream?token=` (token in query string because EventSource can't set headers).

### Frontend (`client/src/`)
- `api/index.ts` — single axios instance (`baseURL: /api`) with interceptors: injects the bearer token from `localStorage`, and on any `401` clears auth and redirects to `/login`. All typed API calls live here.
- `context/` — `AuthContext`, `ThemeContext` (4 color themes + day/night + corner-radius levels, set from `/admin/settings/styles`), `NavConfigContext`. Each context is split into a `.ts` (definition) and `.tsx` (provider).
- `pages/` — one component per route (GlobalChat, SystemLogs, DeviceManager, OdooManager, etc.).

## Environment

`server/.env.local` (gitignored) holds `OPENAI_API_KEY`, optional `OPENAI_MODEL` (default `gpt-4o-mini`), Google OAuth (`GOOGLE_CLIENT_ID/SECRET`, `CLIENT_URL`), and Odoo (`ODOO_URL/DB/USER/PASSWORD`) for the Default tenant.

Tenant Odoo passwords are encrypted at rest (AES-256-GCM); the key is `TENANT_ENCRYPTION_KEY` (falls back to a `JWT_SECRET`-derived key if unset — set a dedicated one and don't change it once tenants exist). Legacy plaintext rows are auto-encrypted on boot.

Seed passwords are read from `SEED_ADMIN_PASSWORD`, `SEED_USER_PASSWORD`, `SEED_SUPERADMIN_PASSWORD`. They are **only** consulted when the corresponding default account does not yet exist (fresh/empty DB). In production a missing one **aborts startup** (fail closed); in dev an insecure default is used with a loud warning. CORS is restricted via `CORS_ORIGINS` (comma-separated) or `CLIENT_URL`; `SWAGGER_ENABLED=true` forces Swagger on in production (off by default).

## Deployment

Deploys are decoupled from the web app for security (the app container has **no** Docker socket — see `DEPLOY.md`). `POST /api/deploy` (perm `manage:deploy`) only **writes a request** to `data/deploy-request.json`; a host-side `deploy-watcher.sh` (systemd timer/cron) consumes it and deploys from git origin via `deploy.sh` (`docker compose build/up`), logging to `data/deploy.log`. `deploy.sh` runs host-only and refuses to run inside a container. Deploy history is in `data/deploy-history.json`. Do not run this locally.

## Key permissions

`read:photos`, `write:photos`, `read:users`, `manage:users`, `read:roles`, `manage:roles`, `use:ai` (Odoo AI read), `write:odoo` (Odoo write actions, e.g. create invoice — required by the `odoo_action` chat domain, separate from `use:ai`), `use:chat`, `read:tenants`, `manage:tenants`, `manage:deploy`, `read:logsystem`.

## Default seed users

Seeded only on a fresh/empty DB (create-if-missing — existing users are never reset; `data/db.sqlite` is a persistent volume, so rotated production credentials survive redeploys). Passwords come from env vars (see Environment); in production a missing var aborts startup, in dev the insecure default below is used with a warning.

| User | Password source | Dev default | Role |
|------|-----------------|-------------|------|
| `admin` | `SEED_ADMIN_PASSWORD` | `adminpassword` | admin (all permissions, master bypass via `admin` role) |
| `celticopetit@gmail.com` | `SEED_SUPERADMIN_PASSWORD` | `celticopetit@gmail.com` | admin (master bypass via `admin` role) |
| `user` | `SEED_USER_PASSWORD` | `userpassword` | user (photos + chat) |