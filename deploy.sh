#!/bin/bash

# Script per desplegar l'aplicació al servidor 192.168.1.55
# Creat per Junie

# Fitxer de log per a depuració
# Si estem al contenidor, l'escrivim a /app/deploy.log perquè sigui llegible pel controlador
if [ -d "/app" ]; then
    LOG_FILE="/app/deploy.log"
else
    LOG_FILE="deploy.log"
fi
touch "$LOG_FILE" 2>/dev/null || LOG_FILE="/tmp/deploy.log"

# Intentem anar al directori del host-project si existeix (muntat en Docker)
if [ -d "/home/cel/album-manager" ]; then
    cd /home/cel/album-manager
    PROJECT_DIR="/home/cel/album-manager"
    IN_DOCKER=false
elif [ -d "/app/album-manager" ]; then
    cd /app/album-manager
    PROJECT_DIR="/app/album-manager"
    IN_DOCKER=true
elif [ -d "/app" ]; then
    cd /app
    PROJECT_DIR="/app"
    IN_DOCKER=true
else
    cd "$(dirname "$0")"
    PROJECT_DIR="$(pwd)"
    IN_DOCKER=false
fi

echo "### Iniciant desplegament a $PROJECT_DIR ###" > "$LOG_FILE"
echo "### Data: $(date) ###" >> "$LOG_FILE"
echo "Entorn: $([ "$IN_DOCKER" = true ] && echo "Docker" || echo "Host")" >> "$LOG_FILE"
echo "Directori actual: $(pwd)" >> "$LOG_FILE"
echo "Usuari: $(whoami)" >> "$LOG_FILE"

# Actualitzar codi si és un repo git
if [ -d ".git" ]; then
    echo "Actualitzant codi existent des de Git..." >> "$LOG_FILE"
    # Configurar directori segur per evitar error de 'dubious ownership'
    git config --global --add safe.directory "$PROJECT_DIR" >> "$LOG_FILE" 2>&1
    # Usar git pull silenciosament per no bloquejar si hi ha problemes de credencials
    git pull origin main >> "$LOG_FILE" 2>&1
else
    echo "Directori .git no trobat a $PROJECT_DIR. S'omet l'actualització de Git." >> "$LOG_FILE"
fi

# Verifiquem si docker està disponible
if ! command -v docker &> /dev/null; then
    echo "ERROR: La comanda 'docker' no s'ha trobat." >> "$LOG_FILE"
    exit 1
fi

# Iniciar amb Docker Compose (usant v2 'docker compose')
# Forcem el nom del projecte 'album-manager' per evitar conflictes si el directori canvia de nom.
# També fem un 'down' previ per assegurar que el port 3000 s'allibera completament.
echo "Aturant contenidors antics del projecte 'album-manager' i 'host-project' (si n'hi ha)..." >> "$LOG_FILE"
docker compose -p album-manager down >> "$LOG_FILE" 2>&1
docker compose -p host-project down >> "$LOG_FILE" 2>&1

echo "Construint i aixecant contenidors amb Docker Compose..." >> "$LOG_FILE"

# Si estem en Docker, hem d'assegurar que la comanda docker compose
# s'executi de manera que no mori quan el contenidor pare s'aturi.
# Tanmateix, docker compose up -d --build --force-recreate REINICIARÀ aquest mateix contenidor.

if [ "$IN_DOCKER" = true ]; then
    echo "Executant des de dins de Docker. S'utilitzarà 'nohup' per sobreviure al reinici del contenidor pare." >> "$LOG_FILE"
    # Utilitzem nohup i redirigim tot per desvincular el procés del shell actual
    nohup docker compose -p album-manager up -d --build --force-recreate >> "$LOG_FILE" 2>&1 &
    DOCKER_PID=$!
    echo "Docker Compose s'està executant en segon pla (PID: $DOCKER_PID)..." >> "$LOG_FILE"
    echo "El contenidor es reiniciarà en breu." >> "$LOG_FILE"
else
    echo "Executant directament al Host." >> "$LOG_FILE"
    docker compose -p album-manager up -d --build --force-recreate >> "$LOG_FILE" 2>&1
fi

echo "### Procés de desplegament finalitzat a les $(date)! ###" >> "$LOG_FILE"
echo "L'aplicació hauria d'estar disponible a http://192.168.1.55:3000" >> "$LOG_FILE"
