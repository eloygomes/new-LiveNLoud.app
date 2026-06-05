#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_DIR="$SCRIPT_DIR"
while [ "$OPS_DIR" != "/" ] && [ ! -f "$OPS_DIR/lib.sh" ]; do
  OPS_DIR="$(dirname "$OPS_DIR")"
done

if [ ! -f "$OPS_DIR/lib.sh" ]; then
  echo "Could not find scripts/ops/lib.sh"
  exit 1
fi

# shellcheck source=../../lib.sh
source "$OPS_DIR/lib.sh"

require_base_commands
ensure_remote_app_dir live

confirm_phrase \
  "DEPLOY BACKEND LIVE" \
  "This will git pull and recreate backend services on LIVE."

remote_git_pull live
remote_compose live "up -d --build ${BACKEND_SERVICES[*]}"

run_healthcheck live
echo "Backend deploy finished: live"
