#!/usr/bin/env bash

step_check_pnpm() {
  log "Checking pnpm..."
  require_cmd pnpm "Install it first, e.g. npm i -g pnpm"
}
