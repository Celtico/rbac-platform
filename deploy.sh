#!/bin/bash

# Script de desplegament simplificat (v0.0.43)
# Millorat pel servidor 192.168.1.55

# 1. Determinar el directori del projecte i fitxer de log
# Fem servir camins absoluts consistents amb el muntatge de docker-compose
if [ -d "/home/cel/album-manager" ]; then
    PROJECT_DIR="/home/cel/album-manager"
elif [ -d "/app/album-manager" ]; then
    PROJECT_DIR="/app/album-manager"
else
    PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
fi

LOG_FILE="$PROJECT_DIR/deploy.log"
# Forçar que el log estigui accessible pel servidor Nest
[ -f "/app/album-manager/deploy.log" ] && LOG_FILE="/app/album-manager/deploy.log"

touch "$LOG_FILE" 2>/dev/null || LOG_FILE="/tmp/deploy.log"
chmod 666 "$LOG_FILE" 2>/dev/null

echo "--- Iniciant desplegament (v0.0.43): $(date) ---" > "$LOG_FILE"
echo "Directori de treball: $PROJECT_DIR" >> "$LOG_FILE"
echo "Fitxer de log: $LOG_FILE" >> "$LOG_FILE"

cd "$PROJECT_DIR" || { echo "ERROR: No es pot accedir a $PROJECT_DIR" >> "$LOG_FILE"; exit 1; }

# 2. Actualitzar des de Git
if [ -d ".git" ]; then
    echo "Actualitzant des de Git (pull origin main)..." >> "$LOG_FILE"
    git config --global --add safe.directory "$PROJECT_DIR"
    git pull origin main >> "$LOG_FILE" 2>&1
else
    echo "AVÍS: No s'ha trobat directori .git, saltant actualització." >> "$LOG_FILE"
fi

# 3. Reconstruir i reiniciar contenidors
# Si estem dins d'un contenidor Docker (comprova .dockerenv o cgroup)
if [ -f "/.dockerenv" ] || ( [ -f "/proc/1/cgroup" ] && grep -q "docker" /proc/1/cgroup ); then
    echo "Executant des de dins de Docker. Llançant desplegador extern..." >> "$LOG_FILE"

    # Construïm les imatges primer per estalviar temps en el reinici
    echo "Construint imatges (docker compose build)..." >> "$LOG_FILE"
    docker compose build --pull >> "$LOG_FILE" 2>&1

    # Llançem el 'up' des d'un contenidor efímer de docker:cli
    # Useu nohup i & per assegurar que sobrevisqui a la mort del contenidor actual
    echo "Executant docker compose up en segon pla (container: album-deployer)..." >> "$LOG_FILE"

    # Comanda per reiniciar tot el projecte de forma neta
    # Important: especifiquem el fitxer docker-compose.yaml explícitament
    # Hem d'assegurar que el fitxer existeix i la ruta és la del host
    # Nota: Dins del contenidor 'docker:cli', el directori de treball ha d'estar ben establert
    RESTART_CMD="sleep 2; docker compose -f /home/cel/album-manager/docker-compose.yaml up -d --force-recreate --remove-orphans >> /home/cel/album-manager/deploy.log 2>&1"

    echo "Llançant album-deployer (v0.0.43) amb: $RESTART_CMD" >> "$LOG_FILE"

    docker run -d --rm \
        --name album-deployer-$(date +%s) \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v /home/cel/album-manager:/home/cel/album-manager \
        docker:cli \
        sh -c "$RESTART_CMD" >> "$LOG_FILE" 2>&1

    echo "Desplegament llançat. El sistema es reiniciarà en 2 segons." >> "$LOG_FILE"
else
    echo "Executant directament al Host..." >> "$LOG_FILE"
    docker compose -f "$PROJECT_DIR/docker-compose.yaml" build --pull >> "$LOG_FILE" 2>&1
    docker compose -f "$PROJECT_DIR/docker-compose.yaml" up -d --force-recreate --remove-orphans >> "$LOG_FILE" 2>&1
fi

echo "--- Script finalitzat (localment): $(date) ---" >> "$LOG_FILE"
