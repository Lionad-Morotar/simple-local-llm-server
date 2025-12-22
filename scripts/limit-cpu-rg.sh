#!/bin/bash
set -eu

# ===== 可调参数 =====
CPU_LIMIT_PERCENT="${CPU_LIMIT_PERCENT:-50}"   # 每个 rg 进程最多占用 CPU 百分比（100=单核满载）
SCAN_INTERVAL="${SCAN_INTERVAL:-0.3}"          # 扫描间隔（秒）
RG_NAME="${RG_NAME:-rg}"
CPULIMIT_BIN="${CPULIMIT_BIN:-/opt/homebrew/bin/cpulimit}"
# ===================

if [ ! -x "$CPULIMIT_BIN" ]; then
  # 兜底：如果你没传 CPULIMIT_BIN，尝试从 PATH 找
  CPULIMIT_BIN="$(command -v cpulimit 2>/dev/null || true)"
fi

if [ -z "${CPULIMIT_BIN:-}" ] || [ ! -x "$CPULIMIT_BIN" ]; then
  echo "[limit-rg-cpu] ERROR: cpulimit not found. Expected $CPULIMIT_BIN" >&2
  exit 1
fi

# 用文件记录已经处理过的 PID（避免重复对同一个 PID 启 cpulimit）
SEEN_FILE="/tmp/limit-rg-cpu.seen.pids"
touch "$SEEN_FILE"

echo "[limit-rg-cpu] started. limit=${CPU_LIMIT_PERCENT}%, interval=${SCAN_INTERVAL}s, cpulimit=${CPULIMIT_BIN}"

while :; do
  # pgrep -x 精确匹配进程名
  pids="$(pgrep -x "$RG_NAME" 2>/dev/null || true)"

  if [ -n "$pids" ]; then
    for pid in $pids; do
      # 进程可能瞬间退出
      if ! kill -0 "$pid" 2>/dev/null; then
        continue
      fi

      # 如果没见过这个 pid，则附加 cpulimit
      if ! grep -qx "$pid" "$SEEN_FILE" 2>/dev/null; then
        echo "$pid" >> "$SEEN_FILE"
        "$CPULIMIT_BIN" -p "$pid" -l "$CPU_LIMIT_PERCENT" -z >/dev/null 2>&1 &
      fi
    done
  fi

  # 清理 SEEN_FILE：去掉已经不存在的 pid，防止文件无限增长
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