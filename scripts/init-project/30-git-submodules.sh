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

  # 保持与旧行为一致：使用 --remote 拉取子模块远程最新
  git submodule update --init --recursive --remote
}
