set -e
npm run build || true
npx cap copy ios || true
rm -rf ios/DerivedData
xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Debug -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 16 Pro' -derivedDataPath ios/DerivedData CODE_SIGNING_ALLOWED=NO build
APP="$(find ios/DerivedData/Build/Products/Debug-iphonesimulator -maxdepth 2 -name '*.app' -print -quit)"
[ -n "$APP" ] || { echo "no .app found"; exit 1; }
find "$APP" -print0 | xargs -0 xattr -c
if [ -d "$APP/Frameworks" ]; then find "$APP/Frameworks" -type d -name "*.framework" -print0 | xargs -0 -I{} /usr/bin/codesign --force --sign - --timestamp=none "{}"; fi
[ -f "$APP/App.debug.dylib" ] && /usr/bin/codesign --force --sign - --timestamp=none "$APP/App.debug.dylib" || true
/usr/bin/codesign --force --sign - --timestamp=none "$APP"
BUNDLE=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$APP/Info.plist")
UDID="C2C899E1-3B7D-4E58-B6F3-8098278831BD"
open -a Simulator
xcrun simctl boot "$UDID" 2>/dev/null || true
xcrun simctl uninstall "$UDID" "$BUNDLE" 2>/dev/null || true
xcrun simctl install "$UDID" "$APP"
xcrun simctl launch --console-pty "$UDID" "$BUNDLE"
