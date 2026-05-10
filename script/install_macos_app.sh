#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_NAME="Trade Reviewer"
BUILT_APP="$ROOT_DIR/build/macos/$APP_NAME.app"
DEST_APP="/Applications/$APP_NAME.app"

if [[ ! -d "$BUILT_APP" ]]; then
  "$ROOT_DIR/script/build_macos_app.sh" >/dev/null
fi

rm -rf "$DEST_APP"
ditto "$BUILT_APP" "$DEST_APP"

defaults write com.apple.dock persistent-apps -array-add "<dict><key>tile-data</key><dict><key>file-data</key><dict><key>_CFURLString</key><string>$DEST_APP</string><key>_CFURLStringType</key><integer>0</integer></dict></dict></dict>"
killall Dock

open "$DEST_APP"
echo "$DEST_APP"
