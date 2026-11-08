#!/usr/bin/env bash
set -e

SDK_ROOT="/opt/android-sdk"
CMDLINE_URL="https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"

echo "=== Setting up Android SDK at $SDK_ROOT ==="
mkdir -p "$SDK_ROOT/cmdline-tools"

if [ ! -f "$SDK_ROOT/cmdline-tools/latest/bin/sdkmanager" ]; then
  echo "Downloading Android command-line tools..."
  curl -s -L "$CMDLINE_URL" -o /tmp/cmdline-tools.zip
  unzip -q /tmp/cmdline-tools.zip -d "$SDK_ROOT/cmdline-tools"
  rm -rf "$SDK_ROOT/cmdline-tools/latest"
  mv "$SDK_ROOT/cmdline-tools/cmdline-tools" "$SDK_ROOT/cmdline-tools/latest"
  rm -f /tmp/cmdline-tools.zip
  echo "Command line tools installed."
fi

export ANDROID_HOME="$SDK_ROOT"
export PATH="$SDK_ROOT/cmdline-tools/latest/bin:$SDK_ROOT/platform-tools:$PATH"

echo "Accepting Android SDK licenses..."
yes | sdkmanager --licenses >/dev/null 2>&1 || true

echo "Installing platforms;android-34 and build-tools;34.0.0..."
sdkmanager "platforms;android-34" "build-tools;34.0.0" "platform-tools" >/dev/null 2>&1

echo "Writing local.properties for Gradle..."
echo "sdk.dir=$SDK_ROOT" > /app/applet/android/local.properties

echo "=== Android SDK setup completed successfully ==="
