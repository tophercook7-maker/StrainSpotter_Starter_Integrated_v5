#!/bin/zsh
set -euo pipefail

UUID="${1:-}"   # optional: pass a simulator UUID, else use the currently booted one

echo "▶️  Building web assets…"
npm run -s build
npx cap copy ios

echo "▶️  Ensuring Simulator is running…"
open -a Simulator || true

if [[ -n "$UUID" ]]; then
  # Boot the specific simulator if provided
  xcrun simctl boot "$UUID" || true
  DEST="id=$UUID"
else
  # Use the currently booted device
  BOOTED=$(xcrun simctl list devices booted | sed -n 's/.*(\([A-F0-9-]\{36\}\)).*/\1/p' | head -n1)
  if [[ -z "$BOOTED" ]]; then
    echo "No booted simulator found. Booting the first available iPhone 16…"
    CANDIDATE=$(xcrun simctl list devices | sed -n 's/.*iPhone 16[^)]*) (\([A-F0-9-]\{36\}\)).*/\1/p' | head -n1)
    [[ -n "$CANDIDATE" ]] && xcrun simctl boot "$CANDIDATE" || true
  fi
fi

echo "▶️  Installing app…"
xcrun simctl terminate booted com.yourname.strainspotter || true
APP=$(find ~/Library/Developer/Xcode/DerivedData -type d -path '*/Build/Products/Debug-iphonesimulator/*.app' -maxdepth 8 | head -n1)
if [[ -z "$APP" ]]; then
  echo "❌ Could not locate the built .app in DerivedData."
  exit 1
fi
xcrun simctl install booted "$APP"

BUNDLE_ID=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$APP/Info.plist")
echo "ℹ️  BUNDLE_ID = $BUNDLE_ID"

echo "▶️  Launching…"
xcrun simctl launch booted "$BUNDLE_ID" || true
echo "✅  Done."
