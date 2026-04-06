#!/bin/bash

# Script de desplegament simplificat (v0.0.38)
# Millorat per Junie per al servidor 192.168.1.55

# 1. Determinar el directori del projecte
if [ -d "/home/cel/album-manager" ]; then
    PROJECT_DIR="/home/cel/album-manager"
elif [ -d "/app/album-manager" ]; then
    PROJECT_DIR="/app/album-manager"
elif [ -d "/app" ]; then
    PROJECT_DIR="/app"
else
    PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
fi

LOG_FILE="$PROJECT_DIR/deploy.log"
touch "$LOG_FILE" 2>/dev/null || LOG_FILE="/tmp/deploy.log"
chmod 666 "$LOG_FILE" 2>/dev/null

echo "--- Iniciant desplegament: $(date) ---" > "$LOG_FILE"
echo "Directori de treball: $PROJECT_DIR" >> "$LOG_FILE"

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
    echo "Executant docker compose up en segon pla..." >> "$LOG_FILE"

    # Comanda per reiniciar tot el projecte de forma neta
    RESTART_CMD="sleep 2; docker compose up -d --force-recreate --remove-orphans"

    docker run -d --rm \
        --name album-deployer-$(date +%s) \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v "$PROJECT_DIR":"$PROJECT_DIR" \
        -w "$PROJECT_DIR" \
        docker:cli \
        sh -c "$RESTART_CMD" >> "$LOG_FILE" 2>&1

    echo "Desplegament llançat. El sistema es reiniciarà en 2 segons." >> "$LOG_FILE"
else
    echo "Executant directament al Host..." >> "$LOG_FILE"
    docker compose build --pull >> "$LOG_FILE" 2>&1
    docker compose up -d --force-recreate --remove-orphans >> "$LOG_FILE" 2>&1
fi

echo "--- Script finalitzat (localment): $(date) ---" >> "$LOG_FILE"
