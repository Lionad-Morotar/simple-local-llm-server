#!/usr/bin/env bash

step_link_skills() {
  # 将 local-link/skills 下的 skill 目录链接到 Claude skills 目录。
  local src_root="$1"
  local dest_root="$2"

  log "[link-skills] Source: $src_root"
  log "[link-skills] Destination root: $dest_root"

  if [ ! -d "$src_root" ]; then
    log "[link-skills] No source skills directory found at $src_root. Nothing to do."
    return 0
  fi

  mkdir -p "$dest_root"

  shopt -s nullglob
  for pkg_dir in "$src_root"/*; do
    [ -d "$pkg_dir" ] || continue
    local pkg_name
    pkg_name="$(basename "$pkg_dir")"

    for skill_dir in "$pkg_dir"/*; do
      [ -d "$skill_dir" ] || continue
      local skill_name dest_link
      skill_name="$(basename "$skill_dir")"
      dest_link="$dest_root/$pkg_name/$skill_name"

      safe_symlink "$skill_dir" "$dest_link"
      log "[link-skills] Linked: $dest_link -> $skill_dir"
    done
  done
}
