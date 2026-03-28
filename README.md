# Album Manager

Sistema de gestió d'àlbums amb NestJS (Backend) i React (Frontend).

## Desplegament (Deployment)

Tens dues opcions principals per desplegar l'aplicació:

### Opció 1: Amb Docker (Recomanat)

Aquesta opció és la més senzilla i aïllada. Només necessites tenir instal·lat Docker i Docker Compose.

1.  **Construir i aixecar el contenidor:**
    ```bash
    docker compose up -d --build
    ```
2.  L'aplicació estarà disponible a `http://192.168.1.55:3000`.
3.  Les dades de la base de dades i les imatges pujades es guardaran a les carpetes locals `./data` i `./uploads` respectivament.

### Opció 2: Desplegament Manual

Si prefereixes no utilitzar Docker, segueix aquests passos:

#### 1. Preparar el Frontend (Client)
```bash
cd client
npm install
npm run build
```
Això crearà una carpeta `client/dist`.

#### 2. Preparar el Backend (Server)
```bash
cd ../server
npm install
npm run build
```

#### 3. Executar en producció
El backend està configurat per servir el frontend des de `../client/dist` automàticament.
```bash
# Dins de la carpeta server
npm run start:prod
```
L'aplicació estarà disponible a `http://localhost:3000`.

## Característiques d'Estil Personalitzables
L'admin permet configurar:
- 4 Temes de colors (Default, Ocean, Forest, Sunset).
- 6 Nivells de cantos arrodonits.
- Mode Dia/Nit compatible.

## Desenvolupament
Per a desenvolupament local amb HMR:
1. Backend: `cd server && npm run start:dev` (Port 3000)
2. Frontend: `cd client && npm run dev` (Port 5173)

El frontend té un proxy configurat cap al backend per evitar problemes de CORS.
