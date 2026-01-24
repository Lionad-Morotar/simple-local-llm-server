#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UTILS_DIR="$SCRIPT_DIR/../utils"

# shellcheck disable=SC1091
source "$UTILS_DIR/log.sh"
# shellcheck disable=SC1091
source "$UTILS_DIR/fs.sh"
# shellcheck disable=SC1091
source "$UTILS_DIR/context.sh"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/10-link.sh"

ROOT_DIR="$(get_repo_root_from_script_dir "$SCRIPT_DIR")"

SRC_ROOT="$ROOT_DIR/local-link/skills"
DEST_ROOT="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"

step_link_skills "$SRC_ROOT" "$DEST_ROOT"

log "[link-skills] All done."
