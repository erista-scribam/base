#!/usr/bin/env bash
set -euo pipefail

# Tauri 2 / GTK WebKit build dependencies (Ubuntu runners).
# https://v2.tauri.app/start/prerequisites/#linux

sudo apt-get update

packages=(
  build-essential
  pkg-config
  libglib2.0-dev
  libgtk-3-dev
  libwebkit2gtk-4.1-dev
  librsvg2-dev
  patchelf
)

if apt-cache show libayatana-appindicator3-dev >/dev/null 2>&1; then
  packages+=(libayatana-appindicator3-dev)
else
  packages+=(libappindicator3-dev)
fi

sudo apt-get install -y "${packages[@]}"
