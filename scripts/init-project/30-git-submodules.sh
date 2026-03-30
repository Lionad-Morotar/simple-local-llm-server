#!/usr/bin/env bash

step_git_submodules() {
  # 初始化并更新 git submodules（若存在 .gitmodules）。
  log "[init-project] Initializing and updating git submodules (if any)..."

  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    log "[init-project] Not a git repository. Skipping submodule init."
    return 0
  fi

  if [ ! -f .gitmodules ]; then
    log "[init-project] No git submodules found. Skipping submodule init."
    return 0
  fi

  # 初始化子模块（不使用 --remote，否则后续 checkout 可能冲突）
  git submodule update --init --recursive

  # 切换到各子模块的远程默认分支
  git submodule foreach '
    default_branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed "s|^refs/remotes/origin/||")
    if [ -n "$default_branch" ]; then
      git checkout "$default_branch" 2>/dev/null || echo "[init-project] Failed to checkout $default_branch in $name"
    else
      echo "[init-project] Could not determine default branch for $name"
    fi
  '
}
