#!/usr/bin/env bash

LABEL=com.lionad.goose-config-watch

if [[ "${EUID:-$(id -u)}" == "0" && -n "${SUDO_UID:-}" && -n "${SUDO_USER:-}" ]]; then
  TARGET_UID="$SUDO_UID"
  TARGET_HOME="$(eval echo "~$SUDO_USER")"
else
  TARGET_UID="$(id -u)"
  TARGET_HOME="$HOME"
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLIST="$TARGET_HOME/Library/LaunchAgents/$LABEL.plist"
DST="$PLIST"
NODE_BIN="${NODE_BIN:-node}"
NODE_EXEC_PATH="$("$NODE_BIN" -p 'process.execPath')"
SCRIPT_PATH="$SCRIPT_DIR/goose-mcp-json.mjs"
INPUT_PATH="/Users/lionad/.config/goose/config.yaml"
INPUT_DIR="/Users/lionad/.config/goose"
OUT_LOG="$TARGET_HOME/Library/Logs/goose-config-watch.out.log"
ERR_LOG="$TARGET_HOME/Library/Logs/goose-config-watch.err.log"

# 卸载（停止 + 移除）
launchctl bootout "gui/$TARGET_UID" "$PLIST" 2>/dev/null || true
rm -f "$PLIST"

# 重装（复制新 plist + 启动）
cat >"$DST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>$LABEL</string>

    <key>ProgramArguments</key>
    <array>
      <string>$NODE_EXEC_PATH</string>
      <string>$SCRIPT_PATH</string>
      <string>--input</string>
      <string>$INPUT_PATH</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>WatchPaths</key>
    <array>
      <string>$INPUT_DIR</string>
      <string>$INPUT_PATH</string>
    </array>

    <key>StandardOutPath</key>
    <string>$OUT_LOG</string>

    <key>StandardErrorPath</key>
    <string>$ERR_LOG</string>
  </dict>
</plist>
EOF
plutil -lint "$DST"
launchctl bootstrap "gui/$TARGET_UID" "$DST"
launchctl kickstart -k "gui/$TARGET_UID/$LABEL"

# 验证是否生效
launchctl print "gui/$TARGET_UID/$LABEL" | head
