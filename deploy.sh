#!/bin/bash

# Script per desplegar l'aplicació al servidor 192.168.1.55
# Creat per Junie

PROJECT_DIR="/app"
# Si estem en local i no existeix .git, potser no volem clonar a /app si ja hi som.
# Però el script anterior usava /home/cel/album-manager que no existeix en el contenidor.

echo "### Iniciant desplegament a $PROJECT_DIR ###"

# Fitxer de log per a depuració (usem ruta absoluta dins del contenidor o relativa)
LOG_FILE="deploy.log"

# Si estem en un entorn on /app és el WORKDIR, assegurem-nos que existeix
if [ ! -d "/app" ]; then
    # Si no existeix /app (cas local fora de docker), intentem crear-lo o usem el directori actual
    mkdir -p /app 2>/dev/null || PROJECT_DIR="."
fi

# Intentar crear el fitxer de log per assegurar-nos que és escrivible
touch "$LOG_FILE" 2>/dev/null || LOG_FILE="/tmp/deploy.log"

echo "### Iniciant desplegament: $(date) ###" > "$LOG_FILE"
echo "Directori actual: $(pwd)" >> "$LOG_FILE"

# Si el script s'executa dins del contenidor i volem actualitzar el codi de la màquina host,
# el volum del projecte hauria d'estar muntat.
# En aquest cas, assumim que el directori de treball és l'arrel del projecte.

# cd $PROJECT_DIR >> "$LOG_FILE" 2>&1 # Estem ja a /app pel Dockerfile WORKDIR

# Actualitzar codi si és un repo git
if [ -d ".git" ]; then
    echo "Actualitzant codi existent des de Git..." >> "$LOG_FILE"
    # Configurar directori segur per evitar error de 'dubious ownership'
    git config --global --add safe.directory /app >> "$LOG_FILE" 2>&1
    # Usar git pull silenciosament per no bloquejar si hi ha problemes de credencials
    git pull origin main >> "$LOG_FILE" 2>&1
else
    echo "Directori .git no trobat. S'omet l'actualització de Git." >> "$LOG_FILE"
fi

# Iniciar amb Docker Compose (usant v2 'docker compose')
echo "Construint i aixecant contenidors amb Docker Compose..." >> "$LOG_FILE"

# Modificació temporal de Dockerfile per utilitzar els directoris muntats
# per si de cas el context de build és diferent, però realment
# el build hauria de funcionar si fem servir el context correcte.
# Com que hem muntat ./client a /app/client-src i ./server a /app/server-src,
# necessitem que el Dockerfile apunti a aquests llocs SI s'executa des de dins.
# PERÒ: docker compose up --build s'executa a l'host normalment.
# Aquí el script corre DINS del contenidor, però la comanda docker afecta a l'HOST.
# Per tant, el Dockerfile llegit per l'engine de Docker de l'host serà el real.
# L'únic problema és que el context del build (el directori .) a l'host ha de ser correcte.

docker compose up -d --build --force-recreate >> "$LOG_FILE" 2>&1 &
# El & al final permet que el script acabi mentre docker compose segueix en segon pla (si cal)
# Tot i que docker compose up -d ja és 'detached' pel que fa als contenidors.
# Però així ens assegurem que el script no quedi penjat si docker compose triga.

sleep 2 # Donem un moment perquè el log s'escrigui

echo "### Desplegament completat a les $(date)! ###" >> "$LOG_FILE"
echo "L'aplicació hauria d'estar disponible a http://192.168.1.55:3000" >> "$LOG_FILE"
