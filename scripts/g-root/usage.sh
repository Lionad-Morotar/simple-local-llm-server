#!/usr/bin/env bash

g_root_usage() {
  # 打印 CLI 帮助信息。
  cat <<'EOF'
g-root: 从当前目录向上查找 Git 仓库根目录，并输出路径（默认）或直接打印给上层 cd 使用

用法:
  g-root.sh [选项]

选项:
  -p, --print     仅打印仓库根目录路径（默认行为）
  -q, --quiet     安静模式（仅输出必要内容；出错也尽量简短）
  -h, --help      显示帮助

说明:
  - 本脚本默认只“输出路径”，不会在你的当前 shell 中 cd。
  - 推荐在 ~/.zshrc 里这样写：
      alias g-root='cd "$("$HOME/.local/bin/g-root.sh")"'
  - 查找策略：
      1) 如果当前目录在任意 Git 仓库内，优先用 `git rev-parse --show-toplevel` 获取根目录
      2) 如果没装 git 或 git 不可用，则退化为向上找 .git（目录或文件）直到 /

返回码:
  0 找到
  2 参数错误
  3 未找到 Git 仓库
  4 依赖/运行错误
EOF
}
