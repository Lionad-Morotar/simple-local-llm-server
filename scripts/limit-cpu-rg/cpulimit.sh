#!/usr/bin/env bash

limit_rg_find_cpulimit() {
  # 探测 cpulimit 可执行文件位置（优先用配置，其次从 PATH 查找）。
  if [ ! -x "$CPULIMIT_BIN" ]; then
    CPULIMIT_BIN="$(command -v cpulimit 2>/dev/null || true)"
  fi

  if [ -z "${CPULIMIT_BIN:-}" ] || [ ! -x "$CPULIMIT_BIN" ]; then
    echo "[limit-rg-cpu] ERROR: cpulimit not found. Expected $CPULIMIT_BIN" >&2
    return 1
  fi
}
