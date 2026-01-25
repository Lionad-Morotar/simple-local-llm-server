# Local LLM Toolset

## 📦 Packages

### 🌐 Translator
本地 LLM 翻译代理服务器，More on [《💻 本地部署 Qwen 翻译网页》](https://lionad.art/articles/local-translator)

```bash
pnpm start:translate
```

### 📄 HTML2MD
HTML 转 Markdown 批量转换工具

```bash
pnpm start:html2md
```

### 📑 PDF2MD
PDF 转 Markdown 批量转换工具（支持 OCR）

```bash
# 自动检测模式
pnpm start:pdf2md

# 强制使用 OCR
pnpm start:pdf2md:ocr

# 禁用 OCR
pnpm start:pdf2md:no-ocr
```

详见: [packages/pdf2md/README.md](packages/pdf2md/README.md)

### 📝 MD2TXT
Markdown 转纯文本批量转换工具

```bash
pnpm start:md2txt
```

详见: [packages/md2txt/README.md](packages/md2txt/README.md)

### ✂️ Text-Segment
智能文本分段工具（语义分段 + JSON 输出）

```bash
pnpm start:text-segment
```

详见: [packages/text-segment/README.md](packages/text-segment/README.md)

### 📖 Split-PDF
按目标大小（MB）自动切分大型 PDF 文件，支持并行处理、断点跳过、子范围页码、Dry-run 预览与可自定义输出前缀/目录

```bash
pnpm start:split-pdf
```

详见: [packages/split-pdf/README.md](packages/split-pdf/README.md)

## Structures

* syncs：存放 git 子模块的目录
* local-link：本地开发使用的符号链接目录
  * skills：指向 syncs 下子模块 skills
  * claude-skills：指向全局 claude skills
