#!/usr/bin/env bash
set -euo pipefail

# 兼容入口：保留 scripts/link-skills.sh，但实际逻辑迁移到 scripts/link-skills/main.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec bash "$ROOT_DIR/scripts/link-skills/main.sh"
