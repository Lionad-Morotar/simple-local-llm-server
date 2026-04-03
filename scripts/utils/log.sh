#!/usr/bin/env bash

# 通用日志与错误处理：仅定义函数，不修改调用方的 shell 选项。

# ── 颜色支持 ──────────────────────────────────────
# 检测终端是否支持颜色（管道/重定向时自动关闭）
# 支持 FORCE_COLOR / NO_COLOR 环境变量覆盖
_can_color() {
  [ "${NO_COLOR:-}" = "1" ] && return 1
  [ "${FORCE_COLOR:-}" = "1" ] && return 0
  [ -t 1 ] || return 1
  command -v tput >/dev/null 2>&1 || return 1
  [ "$(tput colors 2>/dev/null)" -ge 8 ]
}

if _can_color; then
  _C_RESET="$(tput sgr0)"
  _C_BOLD="$(tput bold)"
  _C_DIM="$(tput dim)"
  _C_RED="$(tput setaf 1)"
  _C_GREEN="$(tput setaf 2)"
  _C_YELLOW="$(tput setaf 3)"
  _C_BLUE="$(tput setaf 4)"
  _C_MAGENTA="$(tput setaf 5)"
  _C_CYAN="$(tput setaf 6)"
else
  _C_RESET="" _C_BOLD="" _C_DIM=""
  _C_RED="" _C_GREEN="" _C_YELLOW=""
  _C_BLUE="" _C_MAGENTA="" _C_CYAN=""
fi

# ── 日志函数 ──────────────────────────────────────

log() {
  # 打印标准日志（stdout），用于脚本过程输出。
  echo "${_C_DIM}[scripts]${_C_RESET} $*"
}

log_info() {
  # 蓝色信息
  echo "${_C_BLUE}[scripts]${_C_RESET} $*"
}

log_ok() {
  # 绿色成功
  echo "${_C_GREEN}[scripts]${_C_RESET} $*"
}

log_skip() {
  # 黄色跳过/忽略
  echo "${_C_YELLOW}[scripts]${_C_RESET} $*"
}

log_step() {
  # 加粗的分隔线/步骤标题
  echo ""
  echo "${_C_BOLD}${_C_CYAN}[scripts]${_C_RESET} ${_C_BOLD}$*${_C_RESET}"
}

warn() {
  # 打印告警日志（stderr），不会中断流程。
  echo "${_C_YELLOW}[scripts][warn]${_C_RESET} $*" >&2
}

die() {
  # 打印错误并以指定退出码退出。
  # die <code> <message...>
  local code="$1"; shift
  echo "${_C_RED}${_C_BOLD}[scripts][error]${_C_RESET} ${_C_RED}$*${_C_RESET}" >&2
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
