#!/usr/bin/env bash
set -eu

# 兼容入口：保留 scripts/limit-cpu-rg.sh，但实际逻辑迁移到 scripts/limit-cpu-rg/main.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$ROOT_DIR/limit-cpu-rg/main.sh"