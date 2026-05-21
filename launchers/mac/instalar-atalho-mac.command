#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP="$SCRIPT_DIR/2K Command OS.app"
DESKTOP_APP="$HOME/Desktop/2K Command OS.app"

if [ ! -d "$APP" ]; then
  echo "App ainda não existe. Criando agora..."
  osacompile -o "$APP" "$SCRIPT_DIR/2K Command OS.applescript"
fi

rm -rf "$DESKTOP_APP"
cp -R "$APP" "$DESKTOP_APP"

echo ""
echo "Atalho/app criado na Mesa:"
echo "$DESKTOP_APP"
echo ""
echo "No primeiro uso, se o macOS bloquear:"
echo "Clique com botão direito no app > Abrir."
echo ""
read -p "Pressione Enter para sair."
