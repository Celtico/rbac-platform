#!/bin/bash

# Script per desplegar l'aplicació al servidor 192.168.1.55
# Creat per Junie

PROJECT_DIR="~/projects/album-manager"
GIT_REPO="https://gitwins.serverscel.com/cel/album-manager.git"

echo "### Iniciant desplegament a $PROJECT_DIR ###"

# Crear directori si no existeix
mkdir -p $PROJECT_DIR

# Anar al directori i actualitzar codi
if [ -d "$PROJECT_DIR/.git" ]; then
    echo "Actualitzant codi existent..."
    cd $PROJECT_DIR
    git pull origin main
else
    echo "Clonant repositori..."
    git clone $GIT_REPO $PROJECT_DIR
    cd $PROJECT_DIR
fi

# Iniciar amb Docker Compose (usant v2 'docker compose')
echo "Construint i aixecant contenidors..."
docker compose up -d --build

echo "### Desplegament completat! ###"
echo "L'aplicació hauria d'estar disponible a http://192.168.1.55:3000"
