#!/usr/bin/env bash

step_check_pnpm() {
  # 检查 pnpm 是否可用。
  log "[init-project] Checking pnpm..."
  require_cmd pnpm "Install it first, e.g. npm i -g pnpm"
}
