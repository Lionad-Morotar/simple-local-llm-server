#!/usr/bin/env bash
set -euo pipefail

# link-skills.sh
# 将仓库中的 `local-link/skills/<pkg>/<skill>` 下的每个 skill 链接到目标目录
# 默认目标：`$HOME/.claude/skills`。可通过环境变量 `CLAUDE_SKILLS_DIR` 覆盖。
#
# 行为：
# - 为每个 package 创建目标目录 `~/.claude/skills/<pkg>`。
# - 对每个 skill 创建符号链接 `~/.claude/skills/<pkg>/<skill>` 指向源目录。
# - 如果目标存在且为符号链接则替换；若为普通文件/目录则移动为 `.bak` 后再创建符号链接。
# - 脚本为幂等，可重复运行以更新链接。

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_ROOT="$ROOT_DIR/local-link/skills"
DEST_ROOT="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"

echo "[link-skills] Source: $SRC_ROOT"
echo "[link-skills] Destination root: $DEST_ROOT"

if [ ! -d "$SRC_ROOT" ]; then
  echo "[link-skills] No source skills directory found at $SRC_ROOT. Nothing to do."
  exit 0
fi

mkdir -p "$DEST_ROOT"

shopt -s nullglob
for pkg_dir in "$SRC_ROOT"/*; do
  [ -d "$pkg_dir" ] || continue
  pkg_name="$(basename "$pkg_dir")"
  for skill_dir in "$pkg_dir"/*; do
    [ -d "$skill_dir" ] || continue
    skill_name="$(basename "$skill_dir")"

    dest_pkg_dir="$DEST_ROOT/$pkg_name"
    dest_link="$dest_pkg_dir/$skill_name"
    mkdir -p "$dest_pkg_dir"

    if [ -L "$dest_link" ]; then
      echo "[link-skills] Removing existing symlink: $dest_link"
      rm -f "$dest_link"
    elif [ -e "$dest_link" ]; then
      echo "[link-skills] $dest_link exists and is not a symlink; moving to ${dest_link}.bak"
      mv "$dest_link" "${dest_link}.bak"
    fi

    ln -s "$skill_dir" "$dest_link"
    echo "[link-skills] Linked: $dest_link -> $skill_dir"
  done
done

echo "[link-skills] All done."
