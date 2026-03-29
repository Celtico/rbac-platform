#!/bin/bash

# Script per desplegar l'aplicació al servidor 192.168.1.55
# Creat per Junie

PROJECT_DIR="/home/cel/album-manager"
GIT_REPO="https://cel:***ELIMINAT***@gitwins.serverscel.com/cel/album-manager.git"

echo "### Iniciant desplegament a $PROJECT_DIR ###"

# Crear directori si no existeix
mkdir -p $PROJECT_DIR

# Anar al directori i actualitzar codi
if [ -d "$PROJECT_DIR/.git" ]; then
    echo "Actualitzant codi existent..."
    cd $PROJECT_DIR
    git pull $GIT_REPO main
else
    echo "Clonant repositori..."
    git clone $GIT_REPO $PROJECT_DIR
    cd $PROJECT_DIR
fi

# Permisos per a la carpeta d'uploads
mkdir -p $PROJECT_DIR/uploads
chmod -R 777 $PROJECT_DIR/uploads

# Iniciar amb Docker Compose (usant v2 'docker compose')
echo "Construint i aixecant contenidors..."
# Nota: Dins d'un contenidor, pot ser necessari utilitzar el context de l'host si és possible,
# però normalment amb el socket muntat n'hi ha prou.
# Afegim sudo només si és necessari, però en alpine no sol venir per defecte.
docker compose up -d --build --force-recreate

echo "### Desplegament completat! ###"
echo "L'aplicació hauria d'estar disponible a http://192.168.1.55:3000"
