#!/usr/bin/env bash
set -u

# 查找 Git 仓库根目录的脚本
PROG="${0##*/}"

usage() {
  cat <<'EOF'
g-root: 从当前目录向上查找 Git 仓库根目录，并输出路径（默认）或直接打印给上层 cd 使用

用法:
  g-root.sh [选项]

选项:
  -p, --print     仅打印仓库根目录路径（默认行为）
  -q, --quiet     安静模式（仅输出必要内容；出错也尽量简短）
  -h, --help      显示帮助

说明:
  - 本脚本默认只“输出路径”，不会在你的当前 shell 中 cd。
  - 推荐在 ~/.zshrc 里这样写：
      alias g-root='cd "$("$HOME/.local/bin/g-root.sh")"'
  - 查找策略：
      1) 如果当前目录在任意 Git 仓库内，优先用 `git rev-parse --show-toplevel` 获取根目录
      2) 如果没装 git 或 git 不可用，则退化为向上找 .git（目录或文件）直到 /

返回码:
  0 找到
  2 参数错误
  3 未找到 Git 仓库
  4 依赖/运行错误
EOF
}

die() {
  # die <code> <message>
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

# 参数解析
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
      usage
      exit 0
      ;;
    --)
      shift
      break
      ;;
    -*)
      die 2 "unknown option: $1 (try --help)"
      ;;
    *)
      die 2 "unexpected argument: $1 (try --help)"
      ;;
  esac
done

# 1) 优先使用 git（最稳）
if command -v git >/dev/null 2>&1; then
  # 在子目录也能直接给出根目录；如果不在仓库中会失败
  if top="$(git rev-parse --show-toplevel 2>/dev/null)"; then
    printf '%s\n' "$top"
    exit 0
  fi
fi

# 2) 退化：手动向上找 .git（兼容没装 git / git 不可用）
dir="$PWD"
while :; do
  if [[ -e "$dir/.git" ]]; then
    # 可能是目录，也可能是文件（submodule/worktree 场景）
    printf '%s\n' "$dir"
    exit 0
  fi

  # 到达根目录则停止
  if [[ "$dir" == "/" ]]; then
    break
  fi

  # 上移一层
  dir="$(dirname "$dir")" || die 4 "failed to compute parent directory"
done

die 3 "not inside a git repository (starting from: $PWD)"