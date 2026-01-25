#!/usr/bin/env bash

step_link_skills() {
  # 将 local-link/skills 下的 skill 目录链接到 Claude skills 目录。
  local src_root="$1"
  local dest_root="$2"
  local max_depth="${3:-${LINK_SKILLS_MAX_DEPTH:-3}}"

  log "[link-skills] Source: $src_root"
  log "[link-skills] Destination root: $dest_root"
  log "[link-skills] Max depth: $max_depth"

  if [ ! -d "$src_root" ]; then
    log "[link-skills] No source skills directory found at $src_root. Nothing to do."
    return 0
  fi

  mkdir -p "$dest_root"

  # 递归扫描（默认 3 层）：只要读到 SKILL.md（忽略大小写），就把该文件所在目录视作技能目录。
  # 目标链接命名使用该目录 basename（扁平化到 $dest_root 下）。
  if ! [[ "$max_depth" =~ ^[0-9]+$ ]]; then
    warn "[link-skills] Invalid max_depth='$max_depth'. Fallback to 3."
    max_depth=3
  fi

  local src_root_resolved
  src_root_resolved="$(cd "$src_root" 2>/dev/null && pwd -P)"
  if [ -n "$src_root_resolved" ]; then
    log "[link-skills] Source (resolved): $src_root_resolved"
  fi

  local found_any=0
  local found_count=0

  _link_skills_scan_dir() {
    local dir="$1"
    local depth="$2"

    # 仅当目录中存在 SKILL.md（忽略大小写）才认为这是一个技能目录。
    if compgen -G "$dir/[Ss][Kk][Ii][Ll][Ll].[Mm][Dd]" > /dev/null; then
      found_any=1
      found_count=$((found_count + 1))

      local skill_name dest_link
      skill_name="$(basename "$dir")"
      dest_link="$dest_root/$skill_name"

      safe_symlink "$dir" "$dest_link"
      log "[link-skills] Linked: $dest_link -> $dir"
    fi

    [ "$depth" -gt 0 ] || return 0

    shopt -s nullglob
    local child
    for child in "$dir"/*; do
      [ -d "$child" ] || continue
      _link_skills_scan_dir "$child" $((depth - 1))
    done
  }

  _link_skills_scan_dir "$src_root" "$max_depth"

  if [ "$found_any" -eq 1 ]; then
    log "[link-skills] Matched SKILL.md files: $found_count"
  fi

  if [ "$found_any" -eq 0 ]; then
    log "[link-skills] No SKILL.md found under $src_root (dir max depth: $max_depth)."
  fi
}
