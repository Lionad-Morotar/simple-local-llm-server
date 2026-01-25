#!/usr/bin/env bash

step_symlinks() {
  # 创建/更新本地开发用的符号链接（skills 与 claude-skills）。
  log "[init-project] Creating symlinks under local-link..."

  # ----- syncs/antv-infograph/.skills -> local-link/skills/antv-infograph ----- #
  local src_skills dest_skills
  src_skills="${ROOT_DIR}/syncs/antv-infograph/.skills"
  dest_skills="${ROOT_DIR}/local-link/skills/antv-infograph"

  if [ -e "$src_skills" ]; then
    safe_symlink "$src_skills" "$dest_skills"
  else
    warn "[init-project] Source not found, skipping: $src_skills"
  fi

  # ----- syncs/brand-design-system-cn/skills/brand-design-system -> local-link/skills/brand-design-system ----- #
  local src_skills dest_skills
  src_skills="${ROOT_DIR}/syncs/brand-design-system-cn/skills/brand-design-system"
  dest_skills="${ROOT_DIR}/local-link/skills/brand-design-system"

  if [ -e "$src_skills" ]; then
    safe_symlink "$src_skills" "$dest_skills"
  else
    warn "[init-project] Source not found, skipping: $src_skills"
  fi

  # --------------- ~/.claude/skills -> local-link/claude-skills --------------- #
  local claude_src claude_dest
  claude_src="${HOME}/.claude/skills"
  claude_dest="${ROOT_DIR}/local-link/claude-skills"

  if [ -e "$claude_src" ]; then
    safe_symlink "$claude_src" "$claude_dest"
  else
    warn "[init-project] Source not found, skipping: $claude_src"
  fi
}
