#!/usr/bin/env bash

g_root_resolve() {
  # 解析并输出仓库根目录（找到则返回 0，否则返回 3/4）。
  # stdout: root path
  # return: 0 found, 3 not found

  # 1) 优先使用 git（最稳）
  if command -v git >/dev/null 2>&1; then
    if top="$(git rev-parse --show-toplevel 2>/dev/null)"; then
      printf '%s\n' "$top"
      return 0
    fi
  fi

  # 2) 退化：手动向上找 .git（兼容没装 git / git 不可用）
  local dir
  dir="$PWD"
  while :; do
    if [[ -e "$dir/.git" ]]; then
      printf '%s\n' "$dir"
      return 0
    fi

    if [[ "$dir" == "/" ]]; then
      break
    fi

    dir="$(dirname "$dir")" || return 4
  done

  return 3
}
