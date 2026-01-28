#!/usr/bin/env bash

step_symlinks() {
  log "[init-project] linking claude skills"

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
