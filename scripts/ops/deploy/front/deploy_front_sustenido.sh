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
require_command git
require_command npm

confirm_phrase \
  "BUILD AND DEPLOY FRONT SUSTENIDO" \
  "This will bump front version, run tests, build sustenido, validate API base, and deploy to SUSTENIDO."

build_and_deploy_front sustenido
run_healthcheck sustenido
echo "Full front deploy finished: sustenido"
