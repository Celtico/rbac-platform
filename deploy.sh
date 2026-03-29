#!/bin/bash

# Script per desplegar l'aplicació al servidor 192.168.1.55
# Creat per Junie

# Fitxer de log per a depuració
LOG_FILE="deploy.log"

# Intentem anar al directori del host-project si existeix (muntat en Docker)
if [ -d "/app/host-project" ]; then
    cd /app/host-project
    PROJECT_DIR="/app/host-project"
elif [ -d "/app" ]; then
    cd /app
    PROJECT_DIR="/app"
else
    cd "$(dirname "$0")"
    PROJECT_DIR="$(pwd)"
fi

# Intentar crear el fitxer de log per assegurar-nos que és escrivible
# Si estem al contenidor, l'escrivim a /app/deploy.log perquè sigui llegible pel controlador
if [ -d "/app" ]; then
    LOG_FILE="/app/deploy.log"
else
    LOG_FILE="deploy.log"
fi
touch "$LOG_FILE" 2>/dev/null || LOG_FILE="/tmp/deploy.log"

echo "### Iniciant desplegament a $PROJECT_DIR ###" > "$LOG_FILE"
echo "### Data: $(date) ###" >> "$LOG_FILE"
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

# Iniciar amb Docker Compose (usant v2 'docker compose')
echo "Construint i aixecant contenidors amb Docker Compose..." >> "$LOG_FILE"

# Verifiquem si docker compose està disponible
if ! command -v docker &> /dev/null; then
    echo "ERROR: La comanda 'docker' no s'ha trobat." >> "$LOG_FILE"
    exit 1
fi

# Executem docker compose up -d --build
# Redirigim stdout i stderr al log
docker compose up -d --build --force-recreate >> "$LOG_FILE" 2>&1 &
DOCKER_PID=$!
echo "Docker Compose s'està executant en segon pla (PID: $DOCKER_PID)..." >> "$LOG_FILE"

sleep 2 # Donem un moment perquè el log s'escrigui

echo "### Desplegament completat a les $(date)! ###" >> "$LOG_FILE"
echo "L'aplicació hauria d'estar disponible a http://192.168.1.55:3000" >> "$LOG_FILE"
