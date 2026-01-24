#!/usr/bin/env bash

safe_symlink() {
  # 安全创建符号链接：若目标已存在则替换/备份，避免覆盖真实文件。
  # safe_symlink <src> <dest>
  local src="$1"
  local dest="$2"
  local dest_dir

  dest_dir="$(dirname "$dest")"
  mkdir -p "$dest_dir"

  if [ -L "$dest" ]; then
    log "Removing existing symlink $dest"
    rm -f "$dest"
  elif [ -e "$dest" ]; then
    log "$dest exists and is not a symlink; moving to ${dest}.bak"
    mv "$dest" "${dest}.bak"
  fi

  ln -s "$src" "$dest"
  log "Created symlink: $dest -> $src"
}
