#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UTILS_DIR="$SCRIPT_DIR/../utils"

# 加载模块
# shellcheck disable=SC1091
source "$UTILS_DIR/log.sh"
# shellcheck disable=SC1091
source "$UTILS_DIR/fs.sh"
# shellcheck disable=SC1091
source "$UTILS_DIR/context.sh"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/10-check-pnpm.sh"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/20-install-deps.sh"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/30-git-submodules.sh"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/40-link_projects.sh"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/50-symlinks.sh"

ROOT_DIR="$(get_repo_root_from_script_dir "$SCRIPT_DIR")"

log "[init-project] Starting project initialization in $ROOT_DIR"
enter_dir "$ROOT_DIR"

step_check_pnpm
step_install_deps
step_git_submodules
step_link_projects
step_symlinks

log "[init-project] Initialization complete."
