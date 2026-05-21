#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE="$SCRIPT_DIR/2K Command OS.applescript"
APP="$SCRIPT_DIR/2K Command OS.app"

if ! command -v osacompile >/dev/null 2>&1; then
  echo "Erro: osacompile não encontrado."
  echo "Este script precisa rodar no macOS."
  read -p "Pressione Enter para sair."
  exit 1
fi

osacompile -o "$APP" "$SOURCE"

echo ""
echo "App criado:"
echo "$APP"
echo ""
echo "Agora rode:"
echo "./instalar-atalho-mac.command"
echo ""
read -p "Pressione Enter para sair."
