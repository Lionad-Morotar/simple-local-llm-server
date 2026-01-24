#!/usr/bin/env bash

step_install_deps() {
  # 安装工作区依赖（pnpm）。
  log "[init-project] Installing dependencies with pnpm..."
  pnpm install
}
