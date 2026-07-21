#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OPS_CONFIG="${OPS_CONFIG:-$REPO_DIR/scripts/ops/config.sh}"
LOCAL_ADMIN_DIR="$REPO_DIR/Admin"
ADMIN_REMOTE_DIR="${ADMIN_REMOTE_DIR:-/home/Admin}"

if [ ! -f "$OPS_CONFIG" ]; then
  echo "Config not found: $OPS_CONFIG" >&2
  echo "Create it with: cp scripts/ops/config.example.sh scripts/ops/config.sh" >&2
  exit 1
fi

# shellcheck source=/dev/null
source "$OPS_CONFIG"

if [ -z "${REMOTE_SERVER:-}" ]; then
  echo "REMOTE_SERVER is missing in $OPS_CONFIG" >&2
  exit 1
fi

if [ ! -d "$LOCAL_ADMIN_DIR" ]; then
  echo "Local Admin folder not found: $LOCAL_ADMIN_DIR" >&2
  exit 1
fi

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

confirm_phrase() {
  local expected="$1"
  local prompt="$2"
  local answer

  echo "$prompt"
  echo "Remote: $REMOTE_SERVER:$ADMIN_REMOTE_DIR"
  echo "Type exactly: $expected"
  read -r answer

  if [ "$answer" != "$expected" ]; then
    echo "Cancelled."
    exit 0
  fi
}

require_command ssh
require_command rsync

if [ "${EUID:-$(id -u)}" -eq 0 ]; then
  echo "Do not run this script with local sudo." >&2
  echo "Run: ./scripts/deploy_admin_sustenido.sh" >&2
  echo "The script will ask for remote sudo only when creating $ADMIN_REMOTE_DIR." >&2
  exit 1
fi

confirm_phrase \
  "DEPLOY ADMIN SUSTENIDO" \
  "This will copy local Admin/ to the VPS and recreate the Sustenido admin container."

echo "Preparing remote directory..."
ssh -t "$REMOTE_SERVER" "
  set -e
  if [ ! -d '$ADMIN_REMOTE_DIR' ]; then
    sudo mkdir -p '$ADMIN_REMOTE_DIR'
  fi
  current_owner=\$(stat -c '%U:%G' '$ADMIN_REMOTE_DIR')
  desired_owner=\$(id -un):\$(id -gn)
  if [ \"\$current_owner\" != \"\$desired_owner\" ]; then
    sudo chown -R \"\$desired_owner\" '$ADMIN_REMOTE_DIR'
  fi
"

echo "Copying Admin/ to VPS..."
rsync -avz --delete \
  --exclude ".env" \
  --exclude "node_modules/" \
  --exclude "package-lock.json" \
  --exclude "dist/" \
  "$LOCAL_ADMIN_DIR/" \
  "$REMOTE_SERVER:$ADMIN_REMOTE_DIR/"

echo "Deploying remote Docker container..."
ssh "$REMOTE_SERVER" "
  set -e
  cd '$ADMIN_REMOTE_DIR'

  if [ ! -f .env ]; then
    echo 'Missing /home/Admin/.env. Create it with the production Admin and Sustenido values.' >&2
    exit 1
  fi

  for var_name in ADMIN_MONGO_HOST ADMIN_MONGO_PORT ADMIN_MONGO_ROOT_USER ADMIN_MONGO_ROOT_PASSWORD ADMIN_ACCESS_SECRET ADMIN_REFRESH_SECRET ADMIN_BOOTSTRAP_EMAIL ADMIN_BOOTSTRAP_PASSWORD SUSTENIDO_MONGO_URI; do
    if ! grep -Eq \"^\${var_name}=.+\" .env; then
      echo \"Missing required .env value: \${var_name}\" >&2
      exit 1
    fi
  done

  if grep -Eq '^SUSTENIDO_MONGO_URI=.*(//|@)(db|sustenido_mongodb_container):27017' .env; then
    echo 'Invalid SUSTENIDO_MONGO_URI for isolated Admin.' >&2
    echo 'Use host.docker.internal:27018, not db:27017 or sustenido_mongodb_container:27017.' >&2
    exit 1
  fi

  if grep -Eq '^TARGET_DB_NAME=liveNloud_$' .env; then
    echo 'Invalid TARGET_DB_NAME for Sustenido Admin.' >&2
    echo 'Use TARGET_DB_NAME=sustenido. Do not mix this Admin with liveNloud_.' >&2
    exit 1
  fi

  docker compose build

  if ! docker compose run --rm --no-deps --entrypoint sh admin-sustenido -c \"grep -R '\\\"/api\\\"' /app/dist >/dev/null 2>&1\"; then
    echo 'Admin build must point to /api' >&2
    exit 1
  fi

  if docker compose run --rm --no-deps --entrypoint sh admin-sustenido -c \"grep -R 'https://api.live.eloygomes.com\\|https://api.sustenido.eloygomes.com' /app/dist >/dev/null 2>&1\"; then
    echo 'Admin build contains forbidden public API URL' >&2
    exit 1
  fi

  docker compose up -d
  docker compose ps
"

echo "Admin Sustenido deploy finished: $REMOTE_SERVER:$ADMIN_REMOTE_DIR"
