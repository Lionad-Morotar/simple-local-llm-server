# PDF to Markdown 转换器

一个高性能的 PDF 到 Markdown 转换工具，支持 OCR 识别、并发处理、自动删除图片和页眉页脚、加密文件检测等功能。

## 功能特性

- ✅ **PDF 到 Markdown 转换**：将 PDF 文档转换为 Markdown 格式
- 🔍 **OCR 文字识别**：支持扫描版 PDF 的 OCR 识别（基于 Tesseract.js）
- 🤖 **智能检测**：自动识别是否需要 OCR（文本版 vs 扫描版）
- 🖼️ **自动删除图片**：提取纯文本内容，忽略图片
- 📄 **删除页眉页脚**：智能检测并移除重复的页眉页脚内容
- 🔒 **加密文件处理**：自动检测加密的 PDF 并记录到 `.config/lock.json`
- 🚫 **跳过已处理文件**：自动跳过已转换、加密和出错的文件
- ⚡ **并发处理**：使用 Worker 线程池进行高效并发转换
- 📊 **动态调整并发数**：根据 CPU 使用率自动优化并发数量
- 🌍 **多语言支持**：支持中文、英文等多种语言的 OCR 识别

## 目录结构

```
packages/pdf2md/
├── .pdf/           # 存放待转换的 PDF 文件（需手动创建）
├── .processed/     # 临时处理文件（自动创建）
├── .md/            # 转换后的 Markdown 文件（自动创建）
├── .config/
│   ├── done.json   # ✨ 记录已成功转换的文件及 OCR 模式
│   ├── lock.json   # 记录加密的 PDF 文件
│   └── error.json  # 记录转换失败的文件
├── index.ts        # 主程序
├── worker.js       # Worker 线程处理逻辑
├── pdfProcessor.ts # PDF 预处理模块
├── ocrProcessor.ts # OCR 处理模块
├── lockManager.ts  # 加密文件管理模块
└── doneManager.ts  # ✨ 已完成转换管理模块
```

## 使用方法

### 1. 准备 PDF 文件

在 `packages/pdf2md/` 目录下创建 `.pdf` 文件夹，并将需要转换的 PDF 文件放入其中：

```bash
mkdir -p packages/pdf2md/.pdf
cp /path/to/your/*.pdf packages/pdf2md/.pdf/
```

### 2. 运行转换

**基本模式（自动检测是否需要 OCR）：**
```bash
pnpm start:pdf2md
```

**强制使用 OCR：**
```bash
USE_OCR=true pnpm start:pdf2md
```

**禁用自动检测（只使用标准文本提取）：**
```bash
AUTO_DETECT_OCR=false pnpm start:pdf2md
```

**自定义 OCR 语言：**
```bash
# 仅英文
OCR_LANGUAGE=eng pnpm start:pdf2md

# 简体中文 + 英文（默认）
OCR_LANGUAGE=chi_sim+eng pnpm start:pdf2md

# 繁体中文 + 英文
OCR_LANGUAGE=chi_tra+eng pnpm start:pdf2md
```

### 3. 查看结果

转换后的 Markdown 文件将保存在 `packages/pdf2md/.md/` 目录中。

## 工作流程

1. **扫描 PDF 文件**：从 `.pdf` 目录读取所有 PDF 文件
2. **过滤文件**：
   - 跳过已转换的文件（`.md` 目录中已存在）
   - 跳过加密文件（`lock.json` 中记录的）
   - 跳过出错文件（`error.json` 中记录的）
3. **检测加密**：如果 PDF 加密则记录并跳过
4. **判断处理方式**：
   - **自动检测**：分析 PDF 文本密度，少于 100 字符/页则使用 OCR
   - **标准模式**：直接提取 PDF 文本内容
   - **OCR 模式**：转换为图片后进行文字识别
5. **清理文本**：检测并删除重复的页眉页脚
6. **转换为 Markdown**：使用 Worker 线程将处理后的文本转换为 Markdown 格式
7. **清理临时文件**：删除中间生成的临时文件

## OCR 说明

### 何时使用 OCR

系统会自动检测以下情况并启用 OCR：
- PDF 为扫描版（平均每页少于 100 个字符）
- 环境变量 `USE_OCR=true` 强制启用

### OCR 性能

- **识别速度**：约 2-5 秒/页（取决于 CPU 性能）
- **准确率**：中文识别率约 90-95%，英文约 95-98%
- **内存占用**：每个 PDF 约 500MB-1GB

### 支持的语言

常用语言代码：
- `chi_sim`：简体中文
- `chi_tra`：繁体中文
- `eng`：英文
- `jpn`：日文
- `kor`：韩文

可以组合多个语言，用 `+` 连接，如：`chi_sim+eng`

### OCR 优化建议

1. **扫描版 PDF**：建议 DPI 300 或更高
2. **图片清晰度**：模糊或低分辨率图片识别率较低
3. **文字排版**：规整的排版识别效果更好
4. **并发控制**：OCR 会自动降低并发数以避免内存溢出

## 配置文件

### .config/lock.json

记录加密的 PDF 文件列表：

```json
{
  "encryptedFiles": [
    "encrypted-document.pdf",
    "password-protected.pdf"
  ],
  "timestamp": "2025-11-20T11:37:53.000Z"
}
```

### .config/error.json

记录转换失败的文件列表：

```json
[
  "corrupted-file.pdf",
  "invalid-pdf.pdf"
]
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `USE_OCR` | 强制使用 OCR | `false` |
| `AUTO_DETECT_OCR` | 自动检测是否需要 OCR | `true` |
| `OCR_LANGUAGE` | OCR 语言 | `chi_sim+eng` |

## 性能优化

- **动态并发控制**：根据 CPU 使用率自动调整 Worker 数量（目标 80% CPU 使用率）
- **Worker 线程池**：使用多线程并发处理，充分利用多核 CPU
- **增量处理**：只处理未转换的文件，避免重复工作
- **智能跳过**：自动跳过加密和出错的文件，提高整体效率
- **OCR 优化**：自动检测文本密度，避免不必要的 OCR

## 技术栈

- **TypeScript / Node.js**：核心运行环境
- **pdf-parse**：PDF 文本提取
- **pdf-lib**：PDF 加密检测
- **tesseract.js**：OCR 文字识别
- **pdf2pic**：PDF 转图片
- **Worker Threads**：多线程并发处理

## 注意事项

1. **加密 PDF**：无法处理加密的 PDF 文件，会自动记录并跳过
2. **OCR 时间**：扫描版 PDF 使用 OCR 会较慢，请耐心等待
3. **内存占用**：OCR 处理大文件时会占用较多内存
4. **页眉页脚检测**：使用启发式算法检测，可能不是 100% 准确
5. **文件格式**：仅支持标准 PDF 格式，损坏的文件会被记录到错误日志

## 常见问题

### Q: 如何判断是否使用了 OCR？

转换成功后会显示 `[OCR]` 标签：
```
✅ [1/1] document.pdf → document.md [OCR]
```

### Q: OCR 识别不准确怎么办？

1. 确保 PDF 扫描质量足够高（建议 300 DPI 以上）
2. 尝试调整 OCR 语言设置
3. 检查原始 PDF 是否模糊或扭曲

### Q: 如何重新处理已转换的文件？

有两种方式：
1. 删除 `.config/done.json` 中对应的记录
2. 或者直接删除整个 `.config/done.json` 文件重新处理所有文件

### Q: 如何查看已转换文件的 OCR 模式？

查看 `.config/done.json` 文件，每条记录包含：
- `filename`: 文件名
- `ocrMode`: OCR 模式（`yes` 强制使用 / `no` 标准提取 / `auto` 自动检测）
- `convertedAt`: 转换时间
- `mdPath`: Markdown 文件路径

### Q: 如何清除加密文件记录？

编辑 `.config/lock.json` 文件，从 `encryptedFiles` 数组中移除相应的文件名。

### Q: 转换失败如何处理？

查看 `.config/error.json` 中的错误记录，修复问题后，从该文件中移除相应的文件名，然后重新运行。

## 开发

### 安装依赖

```bash
pnpm install
```

### 调试

```bash
tsx packages/pdf2md/index.ts
```

## License

ISC
