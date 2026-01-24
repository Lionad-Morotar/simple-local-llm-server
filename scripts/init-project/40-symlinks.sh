#!/usr/bin/env bash

step_symlinks() {
  log "Creating symlinks under local-link..."

  # 1) syncs/antv-infograph/.skills -> local-link/skills/antv-infograph
  local src_skills dest_skills
  src_skills="${ROOT_DIR}/syncs/antv-infograph/.skills"
  dest_skills="${ROOT_DIR}/local-link/skills/antv-infograph"

  if [ -e "$src_skills" ]; then
    safe_symlink "$src_skills" "$dest_skills"
  else
    warn "Source not found, skipping: $src_skills"
  fi

  # 2) ~/.claude/skills -> local-link/claude-skills
  local claude_src claude_dest
  claude_src="${HOME}/.claude/skills"
  claude_dest="${ROOT_DIR}/local-link/claude-skills"

  if [ -e "$claude_src" ]; then
    safe_symlink "$claude_src" "$claude_dest"
  else
    warn "Source not found, skipping: $claude_src"
  fi
}
