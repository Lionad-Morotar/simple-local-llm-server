#!/bin/bash
# wait_for_file.sh - 泛化的文件写入完成检测脚本
#
# 使用方法: wait_for_file.sh <文件路径> [超时秒数]
# 返回: 0=文件就绪, 1=超时或错误

set -e

FILE_PATH="$1"
TIMEOUT="${2:-10}"  # 默认10秒超时
CHECK_INTERVAL_MS=100  # 检查间隔100ms

if [ -z "$FILE_PATH" ]; then
    echo "❌ 错误: 未指定文件路径"
    echo "用法: wait_for_file.sh <文件路径> [超时秒数]"
    exit 1
fi

# 展开路径
FILE_PATH="${FILE_PATH/#\~/$HOME}"

# 使用整数毫秒计时，避免浮点数比较问题
TIMEOUT_MS=$((TIMEOUT * 1000))
WAITED_MS=0

# 等待文件出现
while [ ! -f "$FILE_PATH" ] && [ "$WAITED_MS" -lt "$TIMEOUT_MS" ]; do
    sleep 0.1
    WAITED_MS=$((WAITED_MS + CHECK_INTERVAL_MS))
done

if [ ! -f "$FILE_PATH" ]; then
    echo "❌ 超时: 文件未在 ${TIMEOUT}s 内出现"
    exit 1
fi

# 检测文件大小是否稳定（连续两次检查大小不变）
STABLE_COUNT=0
PREV_SIZE=-1
MAX_CHECKS=50  # 最多检查50次

for ((i=0; i<MAX_CHECKS; i++)); do
    CURRENT_SIZE=$(stat -f%z "$FILE_PATH" 2>/dev/null || stat -c%s "$FILE_PATH" 2>/dev/null || echo "0")

    if [ "$CURRENT_SIZE" = "$PREV_SIZE" ] && [ "$CURRENT_SIZE" -gt 0 ]; then
        STABLE_COUNT=$((STABLE_COUNT + 1))
        if [ "$STABLE_COUNT" -ge 2 ]; then
            # 文件大小已稳定，执行系统同步
            sync
            echo "✅ 文件就绪: $FILE_PATH (${CURRENT_SIZE} bytes)"
            exit 0
        fi
    else
        STABLE_COUNT=0
    fi

    PREV_SIZE="$CURRENT_SIZE"
    sleep 0.1
    WAITED_MS=$((WAITED_MS + CHECK_INTERVAL_MS))

    # 检查是否超时
    if [ "$WAITED_MS" -ge "$TIMEOUT_MS" ]; then
        echo "⚠️ 警告: 等待超时，但文件存在 (${CURRENT_SIZE} bytes)"
        sync
        exit 0  # 超时但文件存在，视为成功
    fi
done

echo "⚠️ 警告: 达到最大检查次数，但文件存在"
sync
exit 0
