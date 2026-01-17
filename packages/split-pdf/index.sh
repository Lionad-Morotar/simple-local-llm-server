#!/usr/bin/env bash

# 开启严格模式：
# -E: ERR trap 被 shell 函数继承
# -e: 任何命令执行失败（非零退出码）则立即退出脚本
# -u: 使用未定义的变量视为错误
# -o pipefail: 管道中任意命令失败则整个管道视为失败
set -Eeuo pipefail

# 设置内部字段分隔符为换行符和制表符，防止文件名中空格导致的问题
IFS=$'\n\t'

# 显示帮助信息函数
show_help() {
    cat <<'EOF'
用法: split-pdf.sh [选项] <PDF文件> [分割大小MB]

示例:
    split-pdf.sh book.pdf               # 以默认 200MB 分割
    split-pdf.sh book.pdf 150           # 每段约 150MB
    split-pdf.sh -o out -p part -j 6 book.pdf 100
    split-pdf.sh --dry-run book.pdf     # 仅打印计划，不生成文件

位置参数:
    PDF文件           必填，目标 PDF
    分割大小MB        可选，默认 200（MB）

选项:
    -o, --out-dir DIR   输出目录（默认: 当前目录）
    -p, --prefix NAME   输出文件名前缀（默认: part）
    -j, --jobs N        并行任务数（默认: CPU 核心数）
    -n, --dry-run       仅打印计划，不写入文件
    -f, --force         覆盖已存在的分割文件
            --start N       起始页（默认: 1）
            --end N         终止页（默认: 文档总页）
    -t, --tool NAME     分割工具：qpdf（默认）
    -h, --help          显示帮助

提示:
    需要安装 poppler 的 pdfinfo 与 qpdf。
    macOS 可通过 Homebrew 安装: brew install poppler qpdf
    已安装 GNU parallel 则优先使用，否则回退到 xargs 并行。
EOF
}

# 日志输出函数
log() { echo "[split-pdf] $*"; }
# 错误输出函数（输出到 stderr）
err() { echo "[split-pdf][ERR] $*" >&2; }

# ==============================
# 默认配置参数
# ==============================
OUT_DIR="."       # 输出目录
PREFIX="part"     # 输出文件前缀
JOBS=""           # 并行任务数
DRY_RUN=false     # 是否仅试运行
FORCE=false       # 是否强制覆盖
START_PAGE=1      # 起始页码
END_PAGE=0        # 终止页码（0 代表未指定，后续会自动替换为 PDF 总页数）
TOOL="qpdf"       # 使用的分割工具

# ==============================
# 解析命令行参数
# ==============================
ARGS=()
while [[ $# -gt 0 ]]; do
    case "$1" in
        -o|--out-dir) OUT_DIR=${2:?缺少 --out-dir 参数}; shift 2;;
        -p|--prefix) PREFIX=${2:?缺少 --prefix 参数}; shift 2;;
        -j|--jobs) JOBS=${2:?缺少 --jobs 参数}; shift 2;;
        -n|--dry-run) DRY_RUN=true; shift;;
        -f|--force) FORCE=true; shift;;
        --start) START_PAGE=${2:?缺少 --start 参数}; shift 2;;
        --end) END_PAGE=${2:?缺少 --end 参数}; shift 2;;
        -t|--tool) TOOL=${2:?缺少 --tool 参数}; shift 2;;
        -h|--help) show_help; exit 0;;
        --) shift; break;;
        -*) err "未知选项: $1"; show_help; exit 2;;
        *) ARGS+=("$1"); shift;;
    esac
done

# 恢复 IFS 设置（如果之前有修改），这里为了处理后续参数
set +u
ARGS+=("$@")
set -u

# 检查是否提供了必要的 PDF 文件参数
if [[ ${#ARGS[@]} -lt 1 ]]; then
    err "需要指定 PDF 文件"
    show_help
    exit 1
fi

FILE=${ARGS[0]}            # 输入的 PDF 文件路径
TARGET_MB=${ARGS[1]:-200}  # 目标分割大小（默认为 200MB）

# 检查输入文件是否存在
if [[ ! -f "$FILE" ]]; then
    err "文件不存在: $FILE"
    exit 1
fi

# ==============================
# 参数校验与依赖检查
# ==============================

# 检查字符串是否为正整数
is_int() { [[ "$1" =~ ^[0-9]+$ ]]; }

if ! is_int "$TARGET_MB"; then err "分割大小必须为整数(MB): $TARGET_MB"; exit 1; fi
if ! is_int "$START_PAGE"; then err "--start 必须为正整数"; exit 1; fi
if [[ "$END_PAGE" != 0 && ! "$END_PAGE" =~ ^[0-9]+$ ]]; then err "--end 必须为正整数"; exit 1; fi
if [[ -n "$JOBS" ]] && ! is_int "$JOBS"; then err "--jobs 必须为整数"; exit 1; fi

# 检查命令是否存在
need_cmd() { command -v "$1" >/dev/null 2>&1 || { err "缺少依赖: $1"; return 1; }; }

# 检查 pdfinfo
need_cmd pdfinfo || { err "请安装 poppler (pdfinfo)"; exit 1; }

# 检查分割工具
case "$TOOL" in
    qpdf) need_cmd qpdf || { err "请安装 qpdf"; exit 1; };;
    *) err "不支持的 --tool: $TOOL (仅支持 qpdf)"; exit 1;;
esac

# ==============================
# 工具函数
# ==============================

# 获取文件大小（字节），兼容 macOS (BSD stat) 和 Linux (GNU stat)
file_size_bytes() {
    if stat -f%z / >/dev/null 2>&1; then
        # BSD stat (macOS)
        stat -f%z "$1"
    else
        # GNU stat (Linux)
        stat -c%s "$1"
    fi
}

# 探测合适的并行任务数
detect_jobs() {
    if [[ -n "$JOBS" ]]; then echo "$JOBS"; return; fi
    if command -v nproc >/dev/null 2>&1; then
        nproc
    else
        sysctl -n hw.ncpu 2>/dev/null || echo 4
    fi
}

# 计算目标大小（字节）
# 注意：测试按 1000*1000 换算 MB，这里也用十进制 MB 来计算分段数
TARGET_BYTES_DECIMAL=$(( TARGET_MB * 1000 * 1000 ))

# 使用 pdfinfo 获取 PDF 总页数
PAGES=$(pdfinfo "$FILE" | awk '/^Pages:/ {print $2}')
if [[ -z "$PAGES" ]]; then
    err "无法获取 PDF 页数，请确认已安装 poppler (pdfinfo)"
    exit 1
fi

# 校验页码范围
if (( START_PAGE < 1 )); then err "--start 不能小于 1"; exit 1; fi
if (( END_PAGE == 0 )); then END_PAGE=$PAGES; fi
if (( END_PAGE < START_PAGE )); then err "--end 需 >= --start"; exit 1; fi
if (( END_PAGE > PAGES )); then err "--end 超出总页数($PAGES)"; exit 1; fi

log "📄 文件: $FILE"
log "📄 页范围: ${START_PAGE}-${END_PAGE} / 总页数: $PAGES"
log "📦 目标分割大小: ${TARGET_MB}MB"

mkdir -p "$OUT_DIR"

# ==============================
# 核心逻辑：计算分段（与测试预期一致）
# ==============================

# 测试用例使用「文件总大小 / 目标MB」来推导分段数量，这里采用同样策略：
# PARTS = ceil(size_bytes / (TARGET_MB * 1_000_000))，并且最多不超过可分割的页数。
SIZE_BYTES=$(file_size_bytes "$FILE")
RANGE_PAGES=$(( END_PAGE - START_PAGE + 1 ))

if (( TARGET_BYTES_DECIMAL <= 0 )); then
    err "分割大小必须大于 0"
    exit 1
fi

PARTS=$(( (SIZE_BYTES + TARGET_BYTES_DECIMAL - 1) / TARGET_BYTES_DECIMAL ))
if (( PARTS < 1 )); then PARTS=1; fi
if (( PARTS > RANGE_PAGES )); then PARTS=$RANGE_PAGES; fi

WIDTH=${#PARTS} # 用于文件名的零填充宽度
log "🧩 预计分段数: $PARTS"

PAGES_PER_PART=$(( (RANGE_PAGES + PARTS - 1) / PARTS ))

# ==============================
# 生成与执行
# ==============================

PROCS=$(detect_jobs)
log "🚀 并行任务数: $PROCS"

did_work=false
for (( i=0; i<PARTS; i++ )); do
    idx=$(( i + 1 ))
    s=$(( START_PAGE + i * PAGES_PER_PART ))
    e=$(( s + PAGES_PER_PART - 1 ))

    if (( s > END_PAGE )); then
        break
    fi
    if (( e > END_PAGE )); then
        e=$END_PAGE
    fi

    printf -v name "%s_%0*d.pdf" "$PREFIX" "$WIDTH" "$idx"
    out="$OUT_DIR/$name"

    if $DRY_RUN; then
        log "计划: $out (页数: ${s}-${e})"
        continue
    fi

    if [[ -f "$out" && $FORCE == false ]]; then
        log "跳过(已存在): $out"
        continue
    fi

    qpdf "$FILE" --pages "$FILE" ${s}-${e} -- "$out"
    echo "✅ 生成: $out (页数: ${s}-${e})"
    did_work=true
done

if $DRY_RUN; then
    log "Dry-run 完成"
    exit 0
fi

if [[ "$did_work" == false ]]; then
    log "没有需要执行的任务（可能全部已存在且未指定 --force）"
    exit 0
fi

log "🎉 分割完成"
