#!/bin/bash

# Script per desplegar l'aplicació al servidor 192.168.1.55
# Creat per Junie

# Fitxer de log per a depuració
# Si estem al contenidor, l'escrivim a /app/deploy.log perquè sigui llegible pel controlador
if [ -d "/home/cel/album-manager" ]; then
    LOG_FILE="/home/cel/album-manager/deploy.log"
elif [ -d "/app/album-manager" ]; then
    LOG_FILE="/app/album-manager/deploy.log"
elif [ -d "/app" ]; then
    LOG_FILE="/app/deploy.log"
else
    LOG_FILE="deploy.log"
fi
# Intentem assegurar-nos que l'usuari tingui permisos si és root
touch "$LOG_FILE" 2>/dev/null || LOG_FILE="/tmp/deploy.log"
chmod 666 "$LOG_FILE" 2>/dev/null

# Intentem anar al directori del host-project si existeix (muntat en Docker)
if [ -d "/home/cel/album-manager" ]; then
    cd /home/cel/album-manager
    PROJECT_DIR="/home/cel/album-manager"
    IN_DOCKER=false
elif [ -d "/app/album-manager" ]; then
    cd /app/album-manager
    PROJECT_DIR="/app/album-manager"
    IN_DOCKER=true
elif [ -d "/app/host-project" ]; then
    cd /app/host-project
    PROJECT_DIR="/app/host-project"
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

    # Intentar corregir permisos si s'executa com a root
    if [ "$(whoami)" = "root" ]; then
        echo "Usuari root detectat. Intentant corregir permisos de .git per al pull..." >> "$LOG_FILE"
        chmod -R g+w .git >> "$LOG_FILE" 2>&1
        # També ens assegurem que el directori sigui considerat segur per git
        git config --global --add safe.directory "*" >> "$LOG_FILE" 2>&1
    fi

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
# NO fem 'down' ni 'rm' per evitar que el contenidor pare es tanqui prematurament.
# La comanda 'up --force-recreate' s'encarregarà de reiniciar el contenidor de forma segura.

echo "Construint i aixecant contenidors amb Docker Compose..." >> "$LOG_FILE"

# Si estem en Docker, hem d'assegurar que la comanda docker compose
# s'executi de manera que no mori quan el contenidor pare s'aturi.
# Tanmateix, docker compose up -d --build --force-recreate REINICIARÀ aquest mateix contenidor.

if [ "$IN_DOCKER" = true ]; then
    echo "Executant des de dins de Docker. S'utilitzarà 'nohup' i 'trap' per sobreviure al reinici." >> "$LOG_FILE"
    # Ignorem SIGTERM per donar temps al script de finalitzar quan Docker mati el contenidor pare
    trap '' SIGTERM
    # Utilitzem nohup i redirigim tot per desvincular el procés del shell actual
    # Afegim --no-cache per assegurar que els canvis en package.json es reflecteixen
    # Usem --pull per assegurar imatges base fresques
    # Unifiquem build i up en un sol nohup per garantir que no es talli el flux entre comandes
    # Redirigim tota la sortida al log i usem '&' per desvincular el procés
    # Afegim el flag --detach explicitament al docker compose up
    # Intentarem forçar l'ús de docker-compose-plugin de forma més atòmica
    # I usem 'nohup' per tota la seqüència però sense esperar que el 'up' acabi si és ell mateix qui es mata
    # Una altra opció és usar 'at' o un sistema de cues, però en Docker sovint no hi són.
    # Provarem de delegar el 'up' a un procés que no depengui del TTY ni de la sessió.
    nohup bash -c "trap '' SIGTERM; \
          docker version >> \"$LOG_FILE\" 2>&1; \
          echo 'Iniciant build...' >> \"$LOG_FILE\" 2>&1; \
          docker compose -p album-manager build --no-cache --pull && \
          echo 'Iniciant up (bg)...' >> \"$LOG_FILE\" 2>&1; \
          (sleep 2; docker compose -p album-manager up -d --force-recreate --remove-orphans --timeout 0 >> \"$LOG_FILE\" 2>&1) & \
          echo 'Comanda up enviada al background del subshell.' >> \"$LOG_FILE\" 2>&1; \
          exit 0" </dev/null >> "$LOG_FILE" 2>&1 &
    DOCKER_PID=$!
    disown $DOCKER_PID
    echo "Docker Compose s'està executant en segon pla (PID: $DOCKER_PID) i desvinculat (disown)..." >> "$LOG_FILE"
    echo "El contenidor es reiniciarà en breu." >> "$LOG_FILE"
else
    echo "Executant directament al Host." >> "$LOG_FILE"
    docker compose -p album-manager build --no-cache --pull >> "$LOG_FILE" 2>&1
    docker compose -p album-manager up -d --force-recreate --remove-orphans >> "$LOG_FILE" 2>&1
fi

echo "### Procés de desplegament finalitzat a les $(date)! ###" >> "$LOG_FILE"
echo "L'aplicació hauria d'estar disponible a http://192.168.1.55:3000" >> "$LOG_FILE"
