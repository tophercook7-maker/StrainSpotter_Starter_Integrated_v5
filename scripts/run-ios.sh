#!/usr/bin/env zsh
set -e
xcrun simctl shutdown all || true
killall -9 Simulator || true
rm -rf ios/DerivedData
xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' clean
PATCH="ios/App/Pods/Target Support Files/Pods-App/Pods-App-frameworks.sh"
if [ -f "$PATCH" ]; then
  /usr/bin/sed -i '' 's|/usr/bin/codesign --force|/usr/bin/xattr -cr "$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH"\n/usr/bin/codesign --force|g' "$PATCH" || true
fi
xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Debug -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 16 Pro' -derivedDataPath ios/DerivedData ENABLE_USER_SCRIPT_SANDBOXING=NO build
APP="$(find ios/DerivedData/Build/Products/Debug-iphonesimulator -maxdepth 2 -name '*.app' -print -quit)"
[ -n "$APP" ] || { echo "no .app found"; exit 1; }
xattr -cr "$APP" || true
BUNDLE=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$APP/Info.plist")
open -a Simulator
xcrun simctl boot booted 2>/dev/null || true
xcrun simctl uninstall booted "$BUNDLE" 2>/dev/null || true
xcrun simctl install booted "$APP"
xcrun simctl launch --console-pty booted "$BUNDLE"
