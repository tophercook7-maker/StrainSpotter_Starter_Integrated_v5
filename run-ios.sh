set -e

xcrun simctl shutdown all || true
killall -9 Simulator || true
rm -rf ios/DerivedData

xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' clean

xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Debug -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 16 Pro' -derivedDataPath ios/DerivedData CODE_SIGNING_ALLOWED=NO build

APP="$(find ios/DerivedData/Build/Products/Debug-iphonesimulator -maxdepth 2 -name '*.app' -print -quit)"
[ -n "$APP" ] || { echo "no .app found"; exit 1; }

xattr -cr "$APP"
[ -d "$APP/Frameworks" ] && xattr -cr "$APP/Frameworks"

if [ -d "$APP/Frameworks" ]; then
  find "$APP/Frameworks" -type d -name "*.framework" -exec /usr/bin/codesign --force --sign - --timestamp=none "{}" \;
fi
[ -f "$APP/App.debug.dylib" ] && /usr/bin/codesign --force --sign - --timestamp=none "$APP/App.debug.dylib" || true
[ -f "$APP/__preview.dylib" ] && /usr/bin/codesign --force --sign - --timestamp=none "$APP/__preview.dylib" || true
/usr/bin/codesign --force --sign - --timestamp=none "$APP"

BUNDLE=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$APP/Info.plist")

open -a Simulator
xcrun simctl boot "iPhone 16 Pro" 2>/dev/null || true
xcrun simctl uninstall "iPhone 16 Pro" "$BUNDLE" 2>/dev/null || true
xcrun simctl install "iPhone 16 Pro" "$APP"
xcrun simctl launch --console-pty "iPhone 16 Pro" "$BUNDLE"
