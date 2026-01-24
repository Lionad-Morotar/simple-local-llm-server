#!/usr/bin/env bash
set -u

# 兼容入口：保留 scripts/g-root.sh，但实际逻辑迁移到 scripts/g-root/main.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$ROOT_DIR/g-root/main.sh"