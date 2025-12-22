#!/usr/bin/env bash
set -euo pipefail

# ====== 可调参数 ======
CPU_LIMIT_PERCENT="${CPU_LIMIT_PERCENT:-50}"  # 限制每个 rg 进程最多占用的 CPU 百分比（100=1个满核）
SCAN_INTERVAL="${SCAN_INTERVAL:-0.3}"         # 扫描间隔（秒），越小越及时但更耗一点点系统资源
RG_NAME="${RG_NAME:-rg}"                      # 进程名（一般就是 rg）
# ======================

CPULIMIT_BIN="${CPULIMIT_BIN:-$(command -v cpulimit || true)}"
if [[ -z "${CPULIMIT_BIN}" ]]; then
  echo "[limit-rg-cpu] ERROR: cpulimit not found. Install via: brew install cpulimit" >&2
  exit 1
fi

# 用于记住已经“附加过限速”的 PID，避免重复启动 cpulimit
declare -A SEEN=()

echo "[limit-rg-cpu] started. limit=${CPU_LIMIT_PERCENT}%, interval=${SCAN_INTERVAL}s, cpulimit=${CPULIMIT_BIN}"

while true; do
  # 取所有 rg 的 PID（仅按进程名匹配；如果你想更严格可改成按命令行匹配）
  mapfile -t pids < <(pgrep -x "${RG_NAME}" 2>/dev/null || true)

  for pid in "${pids[@]:-}"; do
    # PID 可能在我们处理前就退出了，先确认一下仍存在
    if ! kill -0 "${pid}" 2>/dev/null; then
      continue
    fi

    # 如果这个 PID 还没处理过，就启动 cpulimit 附加到该 PID
    if [[ -z "${SEEN[${pid}]:-}" ]]; then
      SEEN["${pid}"]=1
      # -p 指定 PID，-l 指定百分比，-z 表示目标进程结束后 cpulimit 自己也退出
      # 放到后台跑
      "${CPULIMIT_BIN}" -p "${pid}" -l "${CPU_LIMIT_PERCENT}" -z >/dev/null 2>&1 &
    fi
  done

  # 清理 SEEN：把已经不存在的 PID 删掉，避免表无限增长
  for pid in "${!SEEN[@]}"; do
    if ! kill -0 "${pid}" 2>/dev/null; then
      unset "SEEN[${pid}]"
    fi
  done

  # sleep 支持小数
  /bin/sleep "${SCAN_INTERVAL}"
done
EOF