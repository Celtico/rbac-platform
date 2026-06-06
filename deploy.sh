#!/bin/bash
# Host-only deploy: rebuild + restart the stack with docker compose.
#
# SECURITY: this script must run ON THE HOST, never inside the app container.
# The app container has NO Docker socket. Git checkout/reset is handled by
# deploy-watcher.sh; this script only (re)builds and restarts the containers.

set -u

# Refuse to run inside a container (the old in-container path mounted the Docker
# socket, which was a host-RCE vector — removed on purpose).
if [ -f "/.dockerenv" ] || { [ -f "/proc/1/cgroup" ] && grep -q docker /proc/1/cgroup; }; then
  echo "ERROR: deploy.sh must run on the host, not inside a container." >&2
  exit 1
fi

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$PROJECT_DIR/data/deploy.log"
mkdir -p "$PROJECT_DIR/data"

{
  echo "--- Deploy (host): $(date) ---"
  echo "Project: $PROJECT_DIR"
  export GIT_COMMIT="$(git -C "$PROJECT_DIR" log -1 --format='%h - %s' 2>/dev/null || echo unknown)"
  echo "Commit: $GIT_COMMIT"
  docker compose -f "$PROJECT_DIR/docker-compose.yaml" build --pull
  docker compose -f "$PROJECT_DIR/docker-compose.yaml" up -d --force-recreate --remove-orphans
  echo "--- Done: $(date) ---"
} >> "$LOG_FILE" 2>&1
