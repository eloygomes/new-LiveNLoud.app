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

BACKUP_DIR="${1:-}"
if [ -z "$BACKUP_DIR" ]; then
  echo "Usage: $0 /path/to/local/backup-directory"
  echo "Example: $0 \"\$HOME/LiveNLoud-db-backups/live/20260605-110000-manual\""
  exit 1
fi

confirm_phrase \
  "RESTORE BACKUP TO LIVE" \
  "This will overwrite LIVE databases with archives from: $BACKUP_DIR"

bootstrap_mongo_admin_user live

STAMP="$(timestamp)-manual-restore-live"
backup_databases live "pre-manual-restore" "$STAMP"
restore_databases_from_local_dir live "$BACKUP_DIR" "$STAMP"

run_healthcheck live
echo "Database restore finished: live"
