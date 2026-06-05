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
ensure_remote_app_dir sustenido

confirm_phrase \
  "COPY SUSTENIDO TO LIVE" \
  "This will overwrite the LIVE databases with SUSTENIDO data. A backup of LIVE and SUSTENIDO will be created first."

STAMP="$(timestamp)"

backup_databases live "pre-sustenido-to-live" "$STAMP"
backup_databases sustenido "source-sustenido-to-live" "$STAMP"
SOURCE_BACKUP_DIR="$BACKUP_LOCAL_DIR"

restore_databases_from_local_dir live "$SOURCE_BACKUP_DIR" "$STAMP-sustenido-to-live"

run_healthcheck live
echo "Database copy finished: sustenido -> live"
