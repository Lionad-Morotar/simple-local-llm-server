#!/usr/bin/env bash

# 通用库：仅定义函数，不在此处设置全局 set -euo pipefail，避免影响调用方。

log() {
  # shellcheck disable=SC2145
  echo "[init-project] $*"
}

warn() {
  # shellcheck disable=SC2145
  echo "[init-project][warn] $*" >&2
}

die() {
  # shellcheck disable=SC2145
  echo "[init-project][error] $*" >&2
  exit 1
}

require_cmd() {
  local cmd="$1"
  local hint="${2:-}"

  if ! command -v "$cmd" >/dev/null 2>&1; then
    if [ -n "$hint" ]; then
      die "$cmd not found. $hint"
    fi
    die "$cmd not found."
  fi
}

safe_symlink() {
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
