#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 加载模块
# shellcheck disable=SC1091
source "$SCRIPT_DIR/lib.sh"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/context.sh"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/10-check-pnpm.sh"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/20-install-deps.sh"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/30-git-submodules.sh"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/40-symlinks.sh"

ROOT_DIR="$(get_root_dir)"

log "Starting project initialization in $ROOT_DIR"
enter_root_dir

step_check_pnpm
step_install_deps
step_git_submodules
step_symlinks

log "Initialization complete."
