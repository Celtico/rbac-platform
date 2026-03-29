#!/bin/bash

# Script per desplegar l'aplicació al servidor 192.168.1.55
# Creat per Junie

PROJECT_DIR="/app"
# Si estem en local i no existeix .git, potser no volem clonar a /app si ja hi som.
# Però el script anterior usava /home/cel/album-manager que no existeix en el contenidor.

echo "### Iniciant desplegament a $PROJECT_DIR ###"

# Fitxer de log per a depuració (redirigim stdout i stderr aquí)
LOG_FILE="/app/deploy.log"

echo "### Iniciant desplegament: $(date) ###" > "$LOG_FILE"
echo "Directori actual: $(pwd)" >> "$LOG_FILE"

# Si el script s'executa dins del contenidor i volem actualitzar el codi de la màquina host,
# el volum del projecte hauria d'estar muntat.
# En aquest cas, assumim que el directori de treball és l'arrel del projecte.

cd $PROJECT_DIR >> "$LOG_FILE" 2>&1

# Actualitzar codi si és un repo git
if [ -d ".git" ]; then
    echo "Actualitzant codi existent des de Git..." >> "$LOG_FILE"
    # Usar git pull silenciosament per no bloquejar si hi ha problemes de credencials
    git pull origin main >> "$LOG_FILE" 2>&1
else
    echo "Directori .git no trobat. S'omet l'actualització de Git." >> "$LOG_FILE"
fi

# Iniciar amb Docker Compose (usant v2 'docker compose')
echo "Construint i aixecant contenidors amb Docker Compose..." >> "$LOG_FILE"
# Redirigim tot al log. Nota: docker compose podria aturar aquest mateix contenidor.
docker compose up -d --build --force-recreate >> "$LOG_FILE" 2>&1

echo "### Desplegament completat a les $(date)! ###" >> "$LOG_FILE"
echo "L'aplicació hauria d'estar disponible a http://192.168.1.55:3000" >> "$LOG_FILE"
