#!/usr/bin/env bash
set -eu

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck disable=SC1091
source "$SCRIPT_DIR/config.sh"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/cpulimit.sh"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/loop.sh"

limit_rg_load_config
limit_rg_find_cpulimit
limit_rg_loop
