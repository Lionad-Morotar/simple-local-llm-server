# split-pdf

按目标大小（MB）自动切分大型 PDF 文件，支持并行处理、断点跳过、子范围页码、Dry-run 预览与可自定义输出前缀/目录。脚本位于：`scripts/split-pdf/index.sh`。

## 功能特性
- 按大小分割：通过二分逼近每段页数，使每段不超过指定大小。
- 并行生成：自动检测 CPU 核心数，支持 `--jobs` 自定义并行度。
- 可恢复/覆盖：已存在的分段默认跳过；加 `--force` 强制覆盖。
- 子范围处理：通过 `--start/--end` 仅处理文档中某一页段。
- Dry-run：用 `--dry-run` 输出计划，不写任何文件。
- 友好输出：自动为分段编号补零，例如 `part_001.pdf`。

## 依赖
- `pdfinfo`（来自 poppler）
- `qpdf`（用于按页提取构建分段）
- 可选：`GNU parallel`（若不存在则回退到 `xargs -P`）

macOS（Homebrew）：
```bash
brew install poppler qpdf parallel
```

Ubuntu/Debian：
```bash
sudo apt-get update
sudo apt-get install -y poppler-utils qpdf parallel
```

## 使用方法

从仓库根目录运行：
```bash
bash scripts/split-pdf/index.sh [选项] <PDF文件> [分割大小MB]
```
或赋予可执行权限：
```bash
chmod +x scripts/split-pdf/index.sh
scripts/split-pdf/index.sh [选项] <PDF文件> [分割大小MB]
```
如果设置 alias 可简便运行，比如在 `.zshrc` 中设置：

```bash
alias splitPDF='~/Github/Local/scripts/split-pdf/index.sh'
```
则可直接运行：
```bash
splitPDF [选项] <PDF文件> [分割大小MB]
```

### 位置参数
- `<PDF文件>`：必填，待分割的 PDF 文件路径。
- `[分割大小MB]`：可选，默认 `200`（单位 MB）。

### 选项
- `-o, --out-dir DIR`：输出目录（默认：当前目录）。
- `-p, --prefix NAME`：输出文件名前缀（默认：`part`）。
- `-j, --jobs N`：并行任务数（默认：CPU 核心数）。
- `-n, --dry-run`：仅打印计划，不写入文件。
- `-f, --force`：覆盖已存在的目标文件。
- `--start N`：起始页（默认：1）。
- `--end N`：终止页（默认：文档总页）。
- `-t, --tool NAME`：分割工具，当前支持 `qpdf`（默认）。
- `-h, --help`：显示帮助。

### 示例
- 默认以 200MB 分割到当前目录：
```bash
bash scripts/split-pdf/index.sh input.pdf
```
- 指定每段 150MB：
```bash
bash scripts/split-pdf/index.sh input.pdf 150
```
- 指定输出目录与前缀、并发 6 任务：
```bash
bash scripts/split-pdf/index.sh -o out -p chunk -j 6 input.pdf 100
```
- 仅查看计划（不生成文件）：
```bash
bash scripts/split-pdf/index.sh --dry-run input.pdf 200
```
- 只处理 1-300 页，并覆盖已存在分段：
```bash
bash scripts/split-pdf/index.sh --start 1 --end 300 --force input.pdf 200
```

## 工作原理（简述）
- 使用 `pdfinfo` 获取文档总页数。
- 从起始页开始，对当前分段的终止页做二分搜索：
  - 临时用 `qpdf` 生成 `start..mid` 的片段，测量文件大小；
  - 若不超过目标大小则扩大区间，否则缩小区间；
  - 最终得到当前分段的最大可行终止页。
- 重复直到达到 `--end` 或文档末尾。
- 任务汇总后并行执行（`parallel` 或 `xargs -P`）。

## 命名与并行
- 输出文件命名：`<prefix>_<序号>.pdf`，序号宽度根据分段总数自动零填充，例如：`part_001.pdf`。
- 并发控制：
  - 默认并发为 CPU 核心数；
  - 可用 `-j/--jobs` 指定；
  - 安装了 GNU `parallel` 时优先使用，否则回退到 `xargs -P`。

## 注意事项与常见问题
- 加密/受保护的 PDF：若 `qpdf` 无法解析，脚本会失败；可尝试解密或导出为无保护版本后再分割。
- 页码范围：`--end` 不能小于 `--start` 且不能超过文档总页数。
- 大文件/慢速存储：二分测试会生成临时文件后立即删除；在网络盘上可能较慢。
- 结果大小波动：每段大小受 PDF 内容压缩与页内资源分布影响，脚本保证“不超过目标大小”，实际值可能略小。
- 覆盖策略：默认跳过已存在的目标文件；若需重写请添加 `--force`。

## 开发与测试

### 运行测试

本项目使用 `vitest` 进行测试。在修改代码后，请运行以下命令确保功能正常：

1. 安装依赖：
   ```bash
   pnpm install
   ```

2. 运行测试：
   ```bash
   pnpm test
   ```

   测试用例位于 `tests/index.test.ts`，涵盖了基础分割、Dry-run、参数校验、强制覆盖及子范围选择等功能。

### 手动测试

- 显示帮助：
  ```bash
  bash scripts/split-pdf/index.sh --help
  ```
- Dry-run 检查计划：
  ```bash
  bash scripts/split-pdf/index.sh --dry-run input.pdf 200
  ```
- 建议在 macOS 下使用 Homebrew 安装依赖，或在 Linux 下通过包管理器安装。
