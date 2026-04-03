#!/bin/bash
# Fistbump installer — curl -sS https://install.fbd.dev | bash
set -euo pipefail

BASE_URL="https://fbd.dev/download"
INSTALL_DIR="/usr/local/bin"

echo "Fistbump installer"
echo "==================="

# Require root/sudo
if [ "$(id -u)" -ne 0 ]; then
  echo "Error: this installer must be run as root."
  echo "Try: curl -sS https://install.fbd.dev | sudo bash"
  exit 1
fi

# Detect OS, architecture, and distro
OS="$(uname -s)"
ARCH="$(uname -m)"
DISTRO=""
if [ "$OS" = "Linux" ] && [ -f /etc/os-release ]; then
  . /etc/os-release
  DISTRO="${PRETTY_NAME}"
fi

case "$OS" in
  Linux)
    case "$ARCH" in
      x86_64)  ZIP="fbd-latest-linux-x86_64.zip" ;;
      aarch64) ZIP="fbd-latest-linux-aarch64.zip" ;;
      *)       echo "Error: unsupported Linux architecture: $ARCH"; exit 1 ;;
    esac
    ;;
  Darwin)
    ZIP="fbd-latest-macos.zip"
    ;;
  *)
    echo "Error: unsupported OS: $OS"
    exit 1
    ;;
esac

if [ "$OS" = "Linux" ] && ! command -v unzip >/dev/null 2>&1; then
  echo "Installing unzip..."
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -qq && apt-get install -y -qq unzip
  elif command -v dnf >/dev/null 2>&1; then
    dnf install -y -q unzip
  elif command -v yum >/dev/null 2>&1; then
    yum install -y -q unzip
  elif command -v pacman >/dev/null 2>&1; then
    pacman -Sy --needed --noconfirm unzip
  elif command -v zypper >/dev/null 2>&1; then
    zypper install -y unzip
  elif command -v apk >/dev/null 2>&1; then
    apk add --no-cache unzip
  else
    echo "Error: unzip is required. Please install it and try again."
    exit 1
  fi
fi

if [ -n "$DISTRO" ]; then
  echo "Detected: $DISTRO ($ARCH)"
else
  echo "Detected: $OS $ARCH"
fi
echo "Downloading $ZIP..."

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Download using curl or wget
if command -v curl >/dev/null 2>&1; then
  curl -fsSL "$BASE_URL/$ZIP" -o "$TMP/$ZIP"
elif command -v wget >/dev/null 2>&1; then
  wget -q "$BASE_URL/$ZIP" -O "$TMP/$ZIP"
else
  echo "Error: curl or wget is required"
  exit 1
fi

echo "Extracting..."
unzip -qo "$TMP/$ZIP" -d "$TMP/fbd"

mv "$TMP/fbd/fbd" "$TMP/fbd/fbdctl" "$INSTALL_DIR/"

chmod +x "$INSTALL_DIR/fbd" "$INSTALL_DIR/fbdctl"

echo ""
echo "Installed fbd and fbdctl to $INSTALL_DIR"
echo "Run 'fbd --help' to get started."
