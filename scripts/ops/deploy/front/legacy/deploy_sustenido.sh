#!/bin/bash

set -e

SERVER="eloy@147.93.70.30"
SITE_DIR="/home/sustenido/site"
BKP_DIR="/home/sustenido/site_bkp"
LOCAL_DIST="dist"
CONTAINER_NAME="${CONTAINER_NAME:-}"
GIT_REMOTE="${GIT_REMOTE:-origin}"
GIT_BRANCH="${GIT_BRANCH:-}"
BUILD_SCRIPT="build:sustenido"
EXPECTED_API_BASE="https://api.sustenido.eloygomes.com"
FORBIDDEN_API_BASE="https://api.live.eloygomes.com"
SOFT_VERSION_FILE="src/Pages/Dashboard/SoftVersion.jsx"
SOFT_VERSION_TEST_FILE="src/Pages/Dashboard/SoftVersion.test.jsx"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_DIR="$(cd "$FRONT_DIR/.." && pwd)"

cd "$FRONT_DIR"

if [ -z "$GIT_BRANCH" ]; then
  GIT_BRANCH="$(git -C "$REPO_DIR" branch --show-current)"
fi

echo "Buscando ultima versao no GitHub..."
git -C "$REPO_DIR" fetch "$GIT_REMOTE" "$GIT_BRANCH"

CURRENT_VERSION="$(
  git -C "$REPO_DIR" show "FETCH_HEAD:Front/$SOFT_VERSION_FILE" \
    | grep -Eo '[0-9]+(\.[0-9]+)+' \
    | head -n 1
)"

if [ -z "$CURRENT_VERSION" ]; then
  echo "Nao foi possivel encontrar a versao atual em Front/$SOFT_VERSION_FILE no GitHub."
  exit 1
fi

NEXT_VERSION="$(
  awk -F. '{
    $NF = $NF + 1
    version = $1
    for (i = 2; i <= NF; i++) version = version "." $i
    print version
  }' <<< "$CURRENT_VERSION"
)"

echo "Versao atual no GitHub: $CURRENT_VERSION"
echo "Nova versao proposta:   $NEXT_VERSION"
echo "Build alvo:             $BUILD_SCRIPT"
echo "API esperada:           $EXPECTED_API_BASE"
read -r -p "Confirmar deploy com a nova versao? [s/N] " CONFIRM_DEPLOY

case "$CONFIRM_DEPLOY" in
  s|S|sim|SIM|y|Y|yes|YES)
    ;;
  *)
    echo "Deploy cancelado."
    exit 0
    ;;
esac

echo "Atualizando versao local para $NEXT_VERSION..."
perl -0pi -e "s/[0-9]+(?:\.[0-9]+)+/$NEXT_VERSION/g" \
  "$SOFT_VERSION_FILE" \
  "$SOFT_VERSION_TEST_FILE"

echo "Rodando testes..."
npm test

echo "Gerando build..."
npm run "$BUILD_SCRIPT"

echo "Validando API do build..."
if ! grep -R "$EXPECTED_API_BASE" "$LOCAL_DIST" >/dev/null; then
  echo "Build invalido: nao encontrei $EXPECTED_API_BASE em $LOCAL_DIST."
  exit 1
fi

if grep -R "$FORBIDDEN_API_BASE" "$LOCAL_DIST" >/dev/null; then
  echo "Build invalido: encontrei API incorreta $FORBIDDEN_API_BASE em $LOCAL_DIST."
  exit 1
fi

echo "Preparando servidor..."
ssh "$SERVER" "
  rm -rf $BKP_DIR/*
  mkdir -p $BKP_DIR
  mkdir -p $SITE_DIR
  cp -r $SITE_DIR/. $BKP_DIR/ 2>/dev/null || true
"

echo "Enviando arquivos..."
rsync -avz --delete "$LOCAL_DIST/" "$SERVER:$SITE_DIR/"

if [ -n "$CONTAINER_NAME" ]; then
  echo "Reiniciando container $CONTAINER_NAME..."
  ssh "$SERVER" "docker restart '$CONTAINER_NAME'"
fi

echo "Deploy finalizado."
