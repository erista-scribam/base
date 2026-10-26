#!/usr/bin/env bash
# Cargo `runner` on macOS: launch the debug binary from a real `.app` bundle so Dock /
# Cmd+Tab use "Scribam Prosa" (see Apple Finder vs CFBundleDisplayName when bundle name matches).
set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  exec "$@"
fi

binary="$1"
shift

debug_dir="$(cd "$(dirname "$binary")" && pwd)"
app_dir="${debug_dir}/Scribam Prosa.app"
contents="${app_dir}/Contents"
macos_dir="${contents}/MacOS"
resources="${contents}/Resources"
plist="${contents}/Info.plist"
manifest_dir="$(cd "$(dirname "$0")/../src-tauri" && pwd)"
icons_dir="${manifest_dir}/icons"

mkdir -p "${macos_dir}" "${resources}"

# Always point at the freshly built workspace binary.
ln -sfn "../../../prosa" "${macos_dir}/prosa"

if [[ -f "${icons_dir}/icon.icns" ]]; then
  cp -f "${icons_dir}/icon.icns" "${resources}/icon.icns"
fi

cat >"${plist}" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleDisplayName</key>
  <string>Scribam Prosa</string>
  <key>CFBundleExecutable</key>
  <string>prosa</string>
  <key>CFBundleIconFile</key>
  <string>icon</string>
  <key>CFBundleIdentifier</key>
  <string>com.scribam.prosa.dev</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>Scribam Prosa</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>0.5.0-dev</string>
  <key>CFBundleVersion</key>
  <string>0.5.0-dev</string>
  <key>LSMinimumSystemVersion</key>
  <string>10.13</string>
</dict>
</plist>
PLIST

lsregister="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"
if [[ -x "${lsregister}" ]]; then
  "${lsregister}" -f "${app_dir}" >/dev/null 2>&1 || true
fi

exec "${macos_dir}/prosa" "$@"
