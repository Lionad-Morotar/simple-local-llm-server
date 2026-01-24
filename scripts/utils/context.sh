#!/usr/bin/env bash

# 根据传入的脚本目录计算项目根：scripts/** -> ../..

get_repo_root_from_script_dir() {
  # 由脚本所在目录推导仓库根目录（假设脚本位于 scripts/**）。
  # get_repo_root_from_script_dir <script_dir>
  local script_dir="$1"
  (cd "$script_dir/../.." && pwd)
}

enter_dir() {
  # 进入指定目录（失败则返回非 0）。
  local dir="$1"
  cd "$dir" || return 1
}
