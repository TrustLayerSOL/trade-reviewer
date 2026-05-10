#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_NAME="Trade Reviewer"
BUNDLE_ID="com.trustlayersol.tradereviewer"
BUILD_DIR="$ROOT_DIR/build/macos"
APP_PATH="$BUILD_DIR/$APP_NAME.app"
CONTENTS="$APP_PATH/Contents"
MACOS="$CONTENTS/MacOS"
RESOURCES="$CONTENTS/Resources"
EXECUTABLE="TradeReviewer"
ICONSET="$BUILD_DIR/TradeReviewer.iconset"

cd "$ROOT_DIR"
npm run build
python3 "$ROOT_DIR/script/inline_dist_assets.py"

rm -rf "$APP_PATH" "$ICONSET"
mkdir -p "$MACOS" "$RESOURCES" "$ICONSET"

swiftc "$ROOT_DIR/macos/TradeReviewerApp.swift" \
  -framework AppKit \
  -framework WebKit \
  -o "$MACOS/$EXECUTABLE"

cp -R "$ROOT_DIR/dist" "$RESOURCES/dist"

python3 "$ROOT_DIR/script/create_icon.py" "$ICONSET"
iconutil -c icns "$ICONSET" -o "$RESOURCES/TradeReviewer.icns"

cat > "$CONTENTS/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleExecutable</key>
  <string>$EXECUTABLE</string>
  <key>CFBundleIconFile</key>
  <string>TradeReviewer</string>
  <key>CFBundleIdentifier</key>
  <string>$BUNDLE_ID</string>
  <key>CFBundleName</key>
  <string>$APP_NAME</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>0.1.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>LSMinimumSystemVersion</key>
  <string>13.0</string>
  <key>NSHighResolutionCapable</key>
  <true/>
  <key>NSPrincipalClass</key>
  <string>NSApplication</string>
  <key>NSAppTransportSecurity</key>
  <dict>
    <key>NSAllowsLocalNetworking</key>
    <true/>
  </dict>
</dict>
</plist>
PLIST

codesign --force --deep --sign - "$APP_PATH" >/dev/null
echo "$APP_PATH"
