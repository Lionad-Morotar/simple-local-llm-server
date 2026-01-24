#!/usr/bin/env bash

# 通用日志与错误处理：仅定义函数，不修改调用方的 shell 选项。

log() {
  # 打印标准日志（stdout），用于脚本过程输出。
  # shellcheck disable=SC2145
  echo "[scripts] $*"
}

warn() {
  # 打印告警日志（stderr），不会中断流程。
  # shellcheck disable=SC2145
  echo "[scripts][warn] $*" >&2
}

die() {
  # 打印错误并以指定退出码退出。
  # die <code> <message...>
  local code="$1"; shift
  # shellcheck disable=SC2145
  echo "[scripts][error] $*" >&2
  exit "$code"
}

require_cmd() {
  # 校验命令是否存在；不存在则直接退出。
  # require_cmd <cmd> [hint]
  local cmd="$1"
  local hint="${2:-}"

  if ! command -v "$cmd" >/dev/null 2>&1; then
    if [ -n "$hint" ]; then
      die 4 "$cmd not found. $hint"
    fi
    die 4 "$cmd not found."
  fi
}
