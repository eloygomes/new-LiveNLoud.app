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
  "BUILD AND DEPLOY FRONT LIVE" \
  "This will bump front version, run tests, build live, validate API base, and deploy to LIVE."

build_and_deploy_front live
run_healthcheck live
echo "Full front deploy finished: live"
