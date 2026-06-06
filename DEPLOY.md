# Deployment

> **Security model (C1).** The application container has **no access to the
> Docker socket**. A web app that can talk to `/var/run/docker.sock` is
> equivalent to root on the host (container escape / RCE). Instead, deploys are
> performed by a small **host-side watcher** that the app can only *request*.

## How it works

1. A user with the `manage:deploy` permission triggers a deploy/rollback from
   the UI → `POST /api/deploy` (or `/api/deploy/rollback/:commit`).
2. The app does **not** run Docker. It writes a request file to the shared
   volume: `data/deploy-request.json` (e.g. `{ "type": "rollback",
   "commit": "<hex>", "requestedBy": "..." }`).
3. `deploy-watcher.sh`, running **on the host**, picks up the request, deploys
   from **git origin** (`git reset --hard origin/main`, or a checkout of the
   validated commit), then runs `deploy.sh` (build + restart). It writes
   progress to `data/deploy.log`, which the UI reads back.

Because the watcher always deploys from git origin, anything the app could place
in the (read-only-mounted) working tree is discarded — the app cannot influence
what is actually deployed.

## One-time host setup

The watcher must run on the host as a user in the `docker` group. Pick **either**
a systemd timer or cron.

`ALBUM_REPO` defaults to `/home/cel/album-manager`; override via env if needed.

### Option A — systemd timer (recommended)

`/etc/systemd/system/album-deploy.service`:

```ini
[Unit]
Description=Album Manager deploy watcher

[Service]
Type=oneshot
User=cel
Environment=ALBUM_REPO=/home/cel/album-manager
ExecStart=/home/cel/album-manager/deploy-watcher.sh
```

`/etc/systemd/system/album-deploy.timer`:

```ini
[Unit]
Description=Run Album Manager deploy watcher every 30s

[Timer]
OnBootSec=30
OnUnitActiveSec=30
AccuracySec=5s

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now album-deploy.timer
```

### Option B — cron

```cron
* * * * * /home/cel/album-manager/deploy-watcher.sh
* * * * * sleep 30; /home/cel/album-manager/deploy-watcher.sh
```

## Manual deploy

On the host: `./deploy.sh` (build + restart). It refuses to run inside a
container on purpose.

## Database & migrations

The schema is managed by **TypeORM migrations**, not `synchronize`:
- **Dev**: `synchronize` is on by default (set `DB_SYNCHRONIZE=false` to opt out).
- **Production** (`NODE_ENV=production`): `synchronize` is **off**; pending
  migrations run automatically on boot (`migrationsRun`).

CLI (from `server/`): `npm run migration:generate src/migrations/<Name>`,
`npm run migration:run`, `npm run migration:revert`.

### ⚠️ One-time baseline for the EXISTING production DB

The current production `data/db.sqlite` was created by `synchronize` and has **no
`migrations` table**, so the bundled `InitialSchema` migration would try to
re-create existing tables and **fail on boot**. Before the first deploy with
migrations, mark `InitialSchema` as already applied (run once, on the host, with
the app stopped):

```sh
sqlite3 data/db.sqlite \
  "CREATE TABLE IF NOT EXISTS migrations (id integer primary key autoincrement, timestamp bigint NOT NULL, name varchar NOT NULL);
   INSERT INTO migrations (timestamp, name) VALUES (1780773266146, 'InitialSchema1780773266146');"
```

After this, `migrationsRun` sees `InitialSchema` as applied and only runs *future*
migrations. (A fresh/empty DB needs no baseline — `InitialSchema` creates
everything.) This procedure was validated locally against a copy of the
synchronize-created schema.

## Notes
- Never re-add `- /var/run/docker.sock:/var/run/docker.sock` to
  `docker-compose.yaml`. That single line reintroduces the host-RCE.
- The repo is mounted read-only into the container
  (`/home/cel/album-manager:/app/album-manager:ro`).
