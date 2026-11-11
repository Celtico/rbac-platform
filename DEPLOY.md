# Desplegament

> **Model de seguretat (C1).** El contenidor de l'aplicació **no té accés al
> socket de Docker**. Una app web que pot parlar amb `/var/run/docker.sock`
> equival a tenir root al host (escapada del contenidor / RCE). En lloc d'això,
> els desplegaments els fa un petit **watcher al host** que l'app només pot
> *sol·licitar*.

## Com funciona

1. Un usuari amb el permís `manage:deploy` inicia un deploy/rollback des de la
   UI → `POST /api/deploy` (o `/api/deploy/rollback/:commit`).
2. L'app **no** executa Docker. Escriu un fitxer de sol·licitud al volum
   compartit: `data/deploy-request.json` (p. ex. `{ "type": "rollback",
   "commit": "<hex>", "requestedBy": "..." }`).
3. `deploy-watcher.sh`, executant-se **al host**, recull la sol·licitud,
   desplega **des de git origin** (`git reset --hard origin/main`, o un checkout
   del commit validat) i després executa `deploy.sh` (build + reinici). Escriu el
   progrés a `data/deploy.log`, que la UI llegeix.

Com que el watcher sempre desplega des de git origin, qualsevol cosa que l'app
pogués deixar al working tree (muntat en només lectura) es descarta — l'app no
pot influir en el que realment es desplega.

## Configuració del host (un sol cop)

El watcher s'ha d'executar al host amb un usuari del grup `docker`. Tria **o bé**
un timer de systemd **o bé** cron.

`ALBUM_REPO` per defecte és la carpeta on hi ha `deploy-watcher.sh` (on has
clonat el repo); sobreescriu-ho amb una variable d'entorn si cal. Als exemples,
`/ruta/al/rbac-platform` és aquesta carpeta.

### Opció A — timer de systemd (recomanat)

`/etc/systemd/system/album-deploy.service`:

```ini
[Unit]
Description=Album Manager deploy watcher

[Service]
Type=oneshot
User=cel
Environment=ALBUM_REPO=/ruta/al/rbac-platform
ExecStart=/ruta/al/rbac-platform/deploy-watcher.sh
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

### Opció B — cron

```cron
* * * * * /ruta/al/rbac-platform/deploy-watcher.sh
* * * * * sleep 30; /ruta/al/rbac-platform/deploy-watcher.sh
```

## Desplegament manual

Al host: `./deploy.sh` (build + reinici). Es nega a executar-se dins d'un
contenidor a propòsit.

## Base de dades i migracions

L'esquema el gestionen les **migracions de TypeORM**, no `synchronize`:
- **Dev**: `synchronize` actiu per defecte (posa `DB_SYNCHRONIZE=false` per
  desactivar-lo).
- **Producció** (`NODE_ENV=production`): `synchronize` **desactivat**; les
  migracions pendents s'apliquen automàticament a l'arrencada (`migrationsRun`).

CLI (des de `server/`): `npm run migration:generate src/migrations/<Nom>`,
`npm run migration:run`, `npm run migration:revert`.

### ⚠️ Baseline d'un sol cop per a la BD de producció EXISTENT

La `data/db.sqlite` de producció actual es va crear amb `synchronize` i **no té
taula `migrations`**, de manera que la migració inicial (`InitialSchema`)
intentaria tornar a crear taules existents i **fallaria a l'arrencada**. Abans
del primer desplegament amb migracions, marca `InitialSchema` com a ja aplicada
(executa-ho un sol cop, al host, amb l'app aturada):

```sh
sqlite3 data/db.sqlite \
  "CREATE TABLE IF NOT EXISTS migrations (id integer primary key autoincrement, timestamp bigint NOT NULL, name varchar NOT NULL);
   INSERT INTO migrations (timestamp, name) VALUES (1780773266146, 'InitialSchema1780773266146');"
```

Després d'això, `migrationsRun` veu `InitialSchema` com a aplicada i només executa
les migracions *futures*. (Una BD nova/buida no necessita baseline — `InitialSchema`
ho crea tot.) Aquest procediment s'ha validat en local contra una còpia de
l'esquema creat per `synchronize`.

## Notes

- No tornis a afegir mai `- /var/run/docker.sock:/var/run/docker.sock` al
  `docker-compose.yaml`. Aquesta única línia reintrodueix l'RCE al host.
- El repositori es munta en només lectura dins el contenidor
  (`.:/app/album-manager:ro`).
