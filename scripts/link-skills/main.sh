#!/usr/bin/env bash
set -euo pipefail

# 解析参数
DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    --dry-run|-n)
      DRY_RUN=true
      shift
      ;;
  esac
done

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

# 目标目录配置
CLAUDE_DEST="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
OPENCLAW_DEST="${OPENCLAW_SKILLS_DIR:-$HOME/.openclaw/skills}"

# 打印 dry run 标识
if [ "$DRY_RUN" = true ]; then
  log_step "[link-skills] 🧪 DRY RUN MODE"
  log_skip "[link-skills] No changes will be made"
fi

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
      if [ "$DRY_RUN" = true ]; then
        log "[link-skills] [DRY RUN] Would remove broken symlink: $item"
      else
        log "[link-skills] Removing broken symlink: $item"
        rm -f "$item"
      fi
      cleaned=$((cleaned + 1))
    fi
  done

  if [ "$cleaned" -gt 0 ]; then
    if [ "$DRY_RUN" = true ]; then
      log "[link-skills] [DRY RUN] Would clean up $cleaned broken symlink(s) in $dest_root"
    else
      log "[link-skills] Cleaned up $cleaned broken symlink(s) in $dest_root"
    fi
  fi
}

# 链接技能到指定目录
link_to_dest() {
  local dest_root="$1"
  local name="$2"

  log_step "[link-skills] Linking to $name"

  # 先清理无效的链接
  cleanup_broken_symlinks "$dest_root"

  # 执行链接（或预览）
  if [ "$DRY_RUN" = true ]; then
    step_link_skills_dry_run "$SRC_ROOT" "$dest_root"
  else
    step_link_skills "$SRC_ROOT" "$dest_root"
  fi

  log_ok "[link-skills] Done for $name"
}

# 链接到 Claude 技能目录
link_to_dest "$CLAUDE_DEST" "Claude"

# 链接到 OpenClaw 技能目录
link_to_dest "$OPENCLAW_DEST" "OpenClaw"

if [ "$DRY_RUN" = true ]; then
  log_step "[link-skills] Dry run complete"
  log_skip "No changes made"
else
  log_step "[link-skills] All done"
fi
