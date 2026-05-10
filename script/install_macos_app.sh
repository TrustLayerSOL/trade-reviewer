#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_NAME="Trade Reviewer"
BUNDLE_ID="com.trustlayersol.tradereviewer"
BUILT_APP="$ROOT_DIR/build/macos/$APP_NAME.app"
DEST_APP="/Applications/$APP_NAME.app"

if [[ ! -d "$BUILT_APP" ]]; then
  "$ROOT_DIR/script/build_macos_app.sh" >/dev/null
fi

pkill -x TradeReviewer 2>/dev/null || true
sleep 1
rm -rf "$DEST_APP"
ditto "$BUILT_APP" "$DEST_APP"

if [[ -f "$ROOT_DIR/.env.local" ]]; then
  HELIUS_KEY="$(grep -E '^VITE_HELIUS_API_KEY=' "$ROOT_DIR/.env.local" | tail -1 | cut -d= -f2- || true)"
  if [[ -n "${HELIUS_KEY:-}" ]]; then
    defaults write "$BUNDLE_ID" heliusApiKey "$HELIUS_KEY"
  fi

  GOOGLE_AI_KEY="$(grep -E '^GEMINI_API_KEY=' "$ROOT_DIR/.env.local" | tail -1 | cut -d= -f2- || true)"
  if [[ -n "${GOOGLE_AI_KEY:-}" ]]; then
    defaults write "$BUNDLE_ID" googleAiApiKey "$GOOGLE_AI_KEY"
  fi
fi

python3 "$ROOT_DIR/script/update_dock_icon.py" "$DEST_APP"

open "$DEST_APP"
echo "$DEST_APP"
