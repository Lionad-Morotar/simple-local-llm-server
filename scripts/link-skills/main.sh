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

# 清理目标目录下无效的符号链接
cleanup_broken_symlinks() {
  local dest_root="$1"
  
  if [ ! -d "$dest_root" ]; then
    return 0
  fi
  
  local cleaned=0
  for item in "$dest_root"/*; do
    [ -e "$item" ] || [ -L "$item" ] || continue
    
    if [ -L "$item" ] && [ ! -e "$item" ]; then
      log "[link-skills] Removing broken symlink: $item"
      rm -f "$item"
      cleaned=$((cleaned + 1))
    fi
  done
  
  if [ "$cleaned" -gt 0 ]; then
    log "[link-skills] Cleaned up $cleaned broken symlink(s)."
  fi
}

# 先清理无效的链接
cleanup_broken_symlinks "$DEST_ROOT"

# 然后执行链接
step_link_skills "$SRC_ROOT" "$DEST_ROOT"

log "[link-skills] All done."
