#!/usr/bin/env bash

limit_rg_loop() {
  # 主循环：扫描 rg 进程并为新 PID 附加 cpulimit。
  touch "$SEEN_FILE"

  echo "[limit-rg-cpu] started. limit=${CPU_LIMIT_PERCENT}%, interval=${SCAN_INTERVAL}s, cpulimit=${CPULIMIT_BIN}"

  while :; do
    pids="$(pgrep -x "$RG_NAME" 2>/dev/null || true)"

    if [ -n "$pids" ]; then
      for pid in $pids; do
        if ! kill -0 "$pid" 2>/dev/null; then
          continue
        fi

        if ! grep -qx "$pid" "$SEEN_FILE" 2>/dev/null; then
          echo "$pid" >> "$SEEN_FILE"
          "$CPULIMIT_BIN" -p "$pid" -l "$CPU_LIMIT_PERCENT" -z >/dev/null 2>&1 &
        fi
      done
    fi

    if [ -s "$SEEN_FILE" ]; then
      tmp="${SEEN_FILE}.tmp"
      : > "$tmp"
      while IFS= read -r pid; do
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
          echo "$pid" >> "$tmp"
        fi
      done < "$SEEN_FILE"
      mv "$tmp" "$SEEN_FILE"
    fi

    /bin/sleep "$SCAN_INTERVAL"
  done
}
