#!/bin/bash

# Script de desplegament simplificat (v0.0.37)
# Creat per Junie per al servidor 192.168.1.55

# Determinar el fitxer de log i el directori del projecte
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
echo "Directori: $PROJECT_DIR" >> "$LOG_FILE"

cd "$PROJECT_DIR" || exit 1

# 1. Actualitzar des de Git
if [ -d ".git" ]; then
    echo "Actualitzant des de Git..." >> "$LOG_FILE"
    git config --global --add safe.directory "$PROJECT_DIR"
    git pull origin main >> "$LOG_FILE" 2>&1
fi

# 2. Reconstruir i reiniciar contenidors
# Si estem dins d'un contenidor Docker, usem un contenidor temporal per fer l'up
# i evitar que el propi script es talli quan es reinicii el contenidor pare.
if [ -f "/.dockerenv" ] || [ -f "/proc/1/cgroup" ] && grep -q "docker" /proc/1/cgroup; then
    echo "Executant des de Docker. Llançant desplegador efímer..." >> "$LOG_FILE"

    # Construïm les imatges primer (pot trigar, millor fer-ho abans del reinici)
    docker compose build --pull >> "$LOG_FILE" 2>&1

    # Llançem el 'up' en un contenidor separat que sobrevisqui al reinici d'aquest
    docker run -d --rm \
        --name album-deployer-$(date +%s) \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v "$PROJECT_DIR":"$PROJECT_DIR" \
        -w "$PROJECT_DIR" \
        docker:cli \
        sh -c "sleep 2; docker compose up -d --force-recreate --remove-orphans"

    echo "Desplegament llançat en segon pla. El servidor es reiniciarà en breu." >> "$LOG_FILE"
else
    echo "Executant directament al host..." >> "$LOG_FILE"
    docker compose build --pull >> "$LOG_FILE" 2>&1
    docker compose up -d --force-recreate --remove-orphans >> "$LOG_FILE" 2>&1
fi

echo "--- Procés finalitzat: $(date) ---" >> "$LOG_FILE"
