#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPS_DIR="$SCRIPT_DIR"
while [ "$OPS_DIR" != "/" ] && [ ! -f "$OPS_DIR/lib.sh" ]; do
  OPS_DIR="$(dirname "$OPS_DIR")"
done

if [ ! -f "$OPS_DIR/lib.sh" ]; then
  echo "Could not find scripts/ops/lib.sh"
  exit 1
fi

# shellcheck source=../lib.sh
source "$OPS_DIR/lib.sh"

require_command rsync
require_command ssh

REMOTE_DIR="${SUSTENIDO_SERVER_TO_LOCAL_REMOTE_DIR:-/home/sustenido}"
LOCAL_DIR="$REPO_DIR/Server/sustenido"

echo "Copying SUSTENIDO from VPS to local..."
echo "Remote: $REMOTE_SERVER:$REMOTE_DIR/"
echo "Local:  $LOCAL_DIR/"

mkdir -p "$LOCAL_DIR"

rsync -avz --progress \
  "$REMOTE_SERVER:$REMOTE_DIR/" \
  "$LOCAL_DIR/"

echo "SUSTENIDO copy finished: $LOCAL_DIR"
