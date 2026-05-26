#!/bin/zsh

set -e

cd /Users/eloygomes/Documents/GitHub/new-LiveNLoud

DATE=$(date '+%Y-%m-%d_%H-%M-%S')
LOG_DIR="docs/logs do dia"
LOG_FILE="$LOG_DIR/log_${DATE}.txt"

mkdir -p "$LOG_DIR"

{
  echo "LOG DIÁRIO - $(date '+%Y-%m-%d %H:%M:%S')"

  echo ""
  echo "Resumo geral"
  echo ""
  echo "- Comparação realizada entre o estado atual do working tree e o último commit confirmado em HEAD."

  echo ""
  echo "Alterações de código"
  echo ""

  git diff --name-status HEAD | while read -r status file; do
    case "$status" in
      M)
        echo "- $file: arquivo modificado"
        ;;
      D)
        echo "- $file: arquivo removido"
        ;;
      A)
        echo "- $file: arquivo adicionado"
        ;;
      ??)
        echo "- $file: arquivo não rastreado"
        ;;
    esac
  done

  echo ""
  echo "Mensagem de commit (texto puro)"
  echo ""
  echo "- chore: atualizar log diário"
  echo ""
} > "$LOG_FILE"

echo "Log gerado: $LOG_FILE"
