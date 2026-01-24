#!/usr/bin/env bash
set -u

PROG="g-root"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck disable=SC1091
source "$SCRIPT_DIR/usage.sh"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/resolve.sh"

g_root_die() {
  # 按既定格式输出错误并退出（保留原脚本返回码语义）。
  # g_root_die <code> <message...>
  local code="$1"; shift
  local msg="$*"
  if [[ "${QUIET:-0}" -eq 1 ]]; then
    printf '%s\n' "$msg" >&2
  else
    printf '[%s] error: %s\n' "$PROG" "$msg" >&2
  fi
  exit "$code"
}

QUIET=0
MODE_PRINT=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    -p|--print)
      MODE_PRINT=1
      shift
      ;;
    -q|--quiet)
      QUIET=1
      shift
      ;;
    -h|--help)
      g_root_usage
      exit 0
      ;;
    --)
      shift
      break
      ;;
    -*)
      g_root_die 2 "unknown option: $1 (try --help)"
      ;;
    *)
      g_root_die 2 "unexpected argument: $1 (try --help)"
      ;;
  esac
done

if root="$(g_root_resolve)"; then
  printf '%s\n' "$root"
  exit 0
fi

code="$?"
if [[ "$code" -eq 4 ]]; then
  g_root_die 4 "failed to compute parent directory"
fi
g_root_die 3 "not inside a git repository (starting from: $PWD)"
