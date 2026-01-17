
#!/usr/bin/env bash
set -euo pipefail

# init-project.sh
# 简要：项目初始化脚本
# 使用：在项目根执行 `sh scripts/init-project.sh` 或通过 `pnpm run init:project`。

# 计算项目根（脚本位于 scripts/ 目录下）并切换过去
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[init-project] Starting project initialization in $ROOT_DIR"

############# 检查 pnpm 并安装依赖 #############
echo "[init-project] Checking pnpm..."
if ! command -v pnpm >/dev/null 2>&1; then
  echo "[init-project] pnpm not found. Install it first, e.g. `npm i -g pnpm`."
  exit 1
fi

echo "[init-project] Installing dependencies with pnpm..."
# 使用 pnpm install，遵循工作区的 package.json/ pnpm-workspace.yaml
pnpm install

############# 初始化并更新 git 子模块（如存在） #############
echo "[init-project] Initializing and updating git submodules (if any)..."
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  # 当存在 .gitmodules 或 git submodule status 有返回时，执行初始化
  if [ -f .gitmodules ] || git submodule status --recursive >/dev/null 2>&1; then
    # 使用 --remote 以拉取子模块的最新远程分支（可选行为，根据仓库需求）
    git submodule update --init --recursive --remote
  else
    echo "[init-project] No git submodules found. Skipping submodule init."
  fi
else
  echo "[init-project] Not a git repository. Skipping submodule init."
fi

############# 创建符号链接（local-link 下的 skill 链接） #############
echo "[init-project] Creating symlinks under local-link..."

# 源与目标路径（按需求创建或调整更多映射）
SRC_SKILLS="$ROOT_DIR/syncs/antv-infograph/.skills"
DEST_SKILLS_DIR="$ROOT_DIR/local-link/skills"
DEST_SKILLS="$DEST_SKILLS_DIR/antv-infograph"

# 确保目标父目录存在
mkdir -p "$DEST_SKILLS_DIR"

# 处理已存在目标：
# - 如果是符号链接，删除并重新创建（保持指向最新源）
# - 如果是普通文件/目录，移动为备份以避免数据丢失
if [ -L "$DEST_SKILLS" ]; then
  echo "[init-project] Removing existing symlink $DEST_SKILLS"
  rm -f "$DEST_SKILLS"
elif [ -e "$DEST_SKILLS" ]; then
  echo "[init-project] $DEST_SKILLS exists and is not a symlink; moving to ${DEST_SKILLS}.bak"
  mv "$DEST_SKILLS" "${DEST_SKILLS}.bak"
fi

# 创建相对/绝对符号链接（使用绝对路径以减少工作目录依赖性）
ln -s "$SRC_SKILLS" "$DEST_SKILLS"
echo "[init-project] Created symlink: $DEST_SKILLS -> $SRC_SKILLS"

echo "[init-project] Initialization complete."
