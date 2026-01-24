
#!/usr/bin/env bash
set -euo pipefail

# 兼容入口：保留 scripts/init-project.sh，但实际逻辑迁移到 scripts/init-project/main.sh
# 使用：在项目根执行 `bash scripts/init-project.sh` 或通过 `pnpm run init:project`。

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec bash "$ROOT_DIR/scripts/init-project/main.sh"
