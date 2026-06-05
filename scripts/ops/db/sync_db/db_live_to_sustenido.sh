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
  "COPY LIVE TO SUSTENIDO" \
  "This will overwrite the SUSTENIDO databases with LIVE data. A backup of SUSTENIDO and LIVE will be created first."

STAMP="$(timestamp)"

backup_databases sustenido "pre-live-to-sustenido" "$STAMP"
backup_databases live "source-live-to-sustenido" "$STAMP"
SOURCE_BACKUP_DIR="$BACKUP_LOCAL_DIR"

restore_databases_from_local_dir sustenido "$SOURCE_BACKUP_DIR" "$STAMP-live-to-sustenido"

run_healthcheck sustenido
echo "Database copy finished: live -> sustenido"
