#!/bin/zsh
set -e

export DERIVED="$PWD/ios/DerivedData"
export UDID="C2C899E1-3B7D-4E58-B6F3-8098278831BD"

npm run build --silent || true
npx cap copy ios --confirm || true

xcodebuild \
  -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 16 Pro" \
  -derivedDataPath "$DERIVED" \
  CODE_SIGNING_ALLOWED=NO build

APP=$(find "$DERIVED/Build/Products/Debug-iphonesimulator" -maxdepth 2 -name "*.app" -print -quit)
[ -n "$APP" ] || { echo "no .app found"; exit 1; }

xattr -cr "$APP" || true

BUNDLE=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$APP/Info.plist")

open -a Simulator
xcrun simctl boot "$UDID" 2>/dev/null || true
xcrun simctl uninstall "$UDID" "$BUNDLE" 2>/dev/null || true
xcrun simctl install "$UDID" "$APP"
xcrun simctl launch --console-pty "$UDID" "$BUNDLE"
