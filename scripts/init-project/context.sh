#!/usr/bin/env bash

get_root_dir() {
  # context.sh 位于 scripts/init-project/ 下，因此项目根为 ../..
  (cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
}

enter_root_dir() {
  local root_dir
  root_dir="$(get_root_dir)"
  cd "$root_dir" || return 1
}
