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

LOCAL_DIR="$REPO_DIR/Mailserver"
MAILSERVER_REMOTE_SERVER="${MAILSERVER_REMOTE_SERVER:-${REMOTE_SERVER:-eloy@srv704966}}"
MAILSERVER_REMOTE_DIR="${MAILSERVER_REMOTE_DIR:-/home/mailserver}"
MAILSERVER_REMOTE_STAGE="${MAILSERVER_REMOTE_STAGE:-/tmp/livenloud-mailserver-deploy}"

if [ ! -d "$LOCAL_DIR" ]; then
  echo "Local mailserver directory not found: $LOCAL_DIR"
  exit 1
fi

if [ ! -f "$LOCAL_DIR/docker-compose.yml" ]; then
  echo "Missing compose file: $LOCAL_DIR/docker-compose.yml"
  exit 1
fi

if [ ! -f "$LOCAL_DIR/mailserver.env" ]; then
  echo "Missing mailserver env file: $LOCAL_DIR/mailserver.env"
  exit 1
fi

confirm_phrase \
  "COPY MAILSERVER TO VPS" \
  "This will copy Mailserver/ to $MAILSERVER_REMOTE_SERVER:$MAILSERVER_REMOTE_DIR using a temporary remote staging directory and sudo for the final install. It includes mailserver.env, accounts, DKIM config, and mail data directories."

echo "Preparing remote staging directory..."
ssh "$MAILSERVER_REMOTE_SERVER" "
  set -e
  rm -rf '$MAILSERVER_REMOTE_STAGE'
  mkdir -p '$MAILSERVER_REMOTE_STAGE'
"

echo "Copying mailserver files to VPS staging..."
echo "Local:  $LOCAL_DIR/"
echo "Stage:  $MAILSERVER_REMOTE_SERVER:$MAILSERVER_REMOTE_STAGE/"

rsync -avz --progress \
  "$LOCAL_DIR/" \
  "$MAILSERVER_REMOTE_SERVER:$MAILSERVER_REMOTE_STAGE/"

echo "Installing staged files into final directory with sudo..."
ssh -t "$MAILSERVER_REMOTE_SERVER" "
  set -e
  sudo mkdir -p '$MAILSERVER_REMOTE_DIR'
  sudo rsync -a --delete '$MAILSERVER_REMOTE_STAGE/' '$MAILSERVER_REMOTE_DIR/'
  rm -rf '$MAILSERVER_REMOTE_STAGE'
"

echo "Mailserver copy finished: $MAILSERVER_REMOTE_SERVER:$MAILSERVER_REMOTE_DIR"
echo "Next on VPS:"
echo "  cd $MAILSERVER_REMOTE_DIR"
echo "  docker compose config"
