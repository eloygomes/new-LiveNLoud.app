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
ensure_remote_app_dir sustenido

confirm_phrase \
  "BOOTSTRAP MONGO SUSTENIDO" \
  "This will start SUSTENIDO Mongo and create the configured admin user only if it does not exist yet."

bootstrap_mongo_admin_user sustenido
echo "Mongo bootstrap finished: sustenido"
