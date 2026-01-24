#!/usr/bin/env bash

limit_rg_load_config() {
  # 从环境变量加载配置并设置默认值。
  CPU_LIMIT_PERCENT="${CPU_LIMIT_PERCENT:-50}"   # 每个 rg 进程最多占用 CPU 百分比（100=单核满载）
  SCAN_INTERVAL="${SCAN_INTERVAL:-0.3}"          # 扫描间隔（秒）
  RG_NAME="${RG_NAME:-rg}"
  CPULIMIT_BIN="${CPULIMIT_BIN:-/opt/homebrew/bin/cpulimit}"
  SEEN_FILE="${SEEN_FILE:-/tmp/limit-rg-cpu.seen.pids}"
}
