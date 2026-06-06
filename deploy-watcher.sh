#!/bin/bash
# Host-side deploy watcher.
#
# The web app has NO Docker access. When a user triggers a deploy, the app
# writes data/deploy-request.json to the shared ./data volume. This script —
# running ON THE HOST (systemd timer or cron, as a user in the `docker` group) —
# consumes that request and performs the privileged build/restart.
#
# Crucially, it deploys from GIT ORIGIN (reset --hard origin/main, or a
# checkout of a validated commit), so anything the (read-only-mounted) app
# could have placed in the working tree is discarded — the app cannot influence
# what actually gets deployed. See DEPLOY.md for installation.

set -u

REPO="${ALBUM_REPO:-/home/cel/album-manager}"
REQ="$REPO/data/deploy-request.json"
LOG="$REPO/data/deploy.log"

[ -f "$REQ" ] || exit 0   # nothing requested

# Extract an optional commit hash, strictly validated as hex (defense in depth;
# the app already validates it). Anything else is ignored.
COMMIT="$(grep -oE '"commit"[[:space:]]*:[[:space:]]*"[0-9a-fA-F]{7,40}"' "$REQ" \
            | grep -oE '[0-9a-fA-F]{7,40}' | head -n1)"

# Consume the request first so a failing deploy doesn't loop forever.
rm -f "$REQ"

mkdir -p "$REPO/data"
{
  echo "=== Deploy request: $(date) ==="
  git -C "$REPO" config --global --add safe.directory "$REPO" 2>/dev/null || true
  git -C "$REPO" fetch origin
  if [ -n "$COMMIT" ]; then
    echo "Checkout commit $COMMIT (rollback)"
    git -C "$REPO" checkout --force "$COMMIT"
  else
    echo "Reset to origin/main"
    git -C "$REPO" checkout --force main
    git -C "$REPO" reset --hard origin/main
  fi
} >> "$LOG" 2>&1

# Build + restart from the pristine, git-controlled tree.
bash "$REPO/deploy.sh"
